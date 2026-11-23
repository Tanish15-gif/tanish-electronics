using Microsoft.Extensions.Caching.Memory;
using TanishElectronics.Api.DTOs.Public.ChatBot;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Exceptions;

namespace TanishElectronics.Api.Services.Security;

// Bounded, process-local drafts. No model output writes a booking; confirmation does.
public sealed class ChatBookingDraftStore : IDisposable
{
    private readonly MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 1000 });
    private readonly object sync = new();
    private sealed class State
    {
        public readonly SemaphoreSlim Gate = new(1, 1);
        public long Revision;
        public ChatBookingDraftDto? Draft;
        public ServiceRequestCreatedDto? Result;
    }
    private State Get(string owner)
    {
        lock (sync)
        {
            if (cache.TryGetValue(owner, out State? state)) return state!;
            state = new State();
            cache.Set(owner, state, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30) });
            if (!cache.TryGetValue(owner, out _)) throw new BadRequestException("Chat is busy. Please try again shortly.");
            return state;
        }
    }
    public async Task<long> BeginMessageAsync(string owner)
    {
        var state = Get(owner);
        await state.Gate.WaitAsync();
        try { state.Draft = null; state.Result = null; return ++state.Revision; }
        finally { state.Gate.Release(); }
    }
    public async Task<ChatBookingDraftDto?> SetAsync(string owner, long revision, ChatBookingDraftDto draft)
    {
        var state = Get(owner);
        await state.Gate.WaitAsync();
        try
        {
            if (revision != state.Revision) return null;
            draft.DraftId = Guid.NewGuid().ToString("N");
            draft.ExpiresAt = DateTime.UtcNow.AddMinutes(10);
            state.Draft = draft;
            return draft;
        }
        finally { state.Gate.Release(); }
    }
    public async Task<ServiceRequestCreatedDto> ConfirmAsync(string owner, string draftId, Func<CreateServiceRequestDto, Task<ServiceRequestCreatedDto>> submit)
    {
        var state = Get(owner);
        await state.Gate.WaitAsync();
        try
        {
            if (state.Draft == null || state.Draft.DraftId != draftId)
                throw new BadRequestException("This summary has been replaced. Please review the latest booking summary.");
            if (state.Result != null) return state.Result;
            if (state.Draft.ExpiresAt <= DateTime.UtcNow)
                throw new BadRequestException("This booking summary has expired. Please ask for a new summary.");
            state.Result = await submit(state.Draft.Details);
            return state.Result;
        }
        finally { state.Gate.Release(); }
    }
    public void Dispose() => cache.Dispose();
}
