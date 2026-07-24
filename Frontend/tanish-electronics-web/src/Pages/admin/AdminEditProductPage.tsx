import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApiAuth } from "../../hooks/useApiAuth";
import {
  getAdminProductById,
  getProductCategories,
  getProductConditions,
  updateAdminProduct,
  uploadProductImage
} from "../../Services/adminProductService";
import type { LookUpItem } from "../../Services/serviceRequestService";
import ActionButton from "../../components/UI/ActionButton";

type ProductForm = {
  productCategoryId: number;
  productConditionId: number;

  productName: string;
  brand: string;
  modelName: string;
  description: string;

  price: string;
  stockQuantity: string;

  isAvailable: boolean;
  isFeatured: boolean;
};

function AdminEditProductPage() {
  const { getToken } = useApiAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<LookUpItem[]>([]);
  const [conditions, setConditions] = useState<LookUpItem[]>([]);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");

  const [form, setForm] = useState<ProductForm>({
    productCategoryId: 0,
    productConditionId: 0,
    productName: "",
    brand: "",
    modelName: "",
    description: "",
    price: "",
    stockQuantity: "0",
    isAvailable: true,
    isFeatured: false
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    loadPageData();
  }, [id]);

  function getProductImageUrl(imageUrl?: string | null) {
    if (!imageUrl) {
      return "";
    }

    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    return `${import.meta.env.VITE_API_BASE_URL}${
      imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`
    }`;
  }

  async function loadPageData() {
    const token = await getToken();

    try {
      if (!id) return;

      setLoading(true);
      setError("");

      const [categoryData, conditionData, productData] = await Promise.all([
        getProductCategories(),
        getProductConditions(),
        getAdminProductById(Number(id), token)
      ]);

      setCategories(categoryData);
      setConditions(conditionData);

      setForm({
        productCategoryId: productData.productCategoryId,
        productConditionId: productData.productConditionId,

        productName: productData.productName,
        brand: productData.brand || "",
        modelName: productData.modelName || "",
        description: productData.description || "",

        price: productData.price.toString(),
        stockQuantity: productData.stockQuantity.toString(),

        isAvailable: productData.isAvailable,
        isFeatured: productData.isFeatured
      });

      setCurrentImageUrl(productData.primaryImageUrl || "");
      setImagePreview(getProductImageUrl(productData.primaryImageUrl));
    } catch {
      setError("Failed to load product.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleProductImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setImageError("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be less than 5MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));

    event.target.value = "";
  }

  function cancelImageChange() {
    setSelectedImage(null);
    setImageError("");
    setImagePreview(getProductImageUrl(currentImageUrl));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) return;

    if (form.productCategoryId <= 0) {
      setError("Select product category.");
      return;
    }

    if (form.productConditionId <= 0) {
      setError("Select product condition.");
      return;
    }

    if (form.productName.trim() === "") {
      setError("Product name is required.");
      return;
    }

    if (Number(form.price) < 0 || form.price.trim() === "") {
      setError("Enter valid price.");
      return;
    }

    if (Number(form.stockQuantity) < 0 || form.stockQuantity.trim() === "") {
      setError("Enter valid stock quantity.");
      return;
    }

    const token = await getToken();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await updateAdminProduct(
        Number(id),
        {
          productCategoryId: form.productCategoryId,
          productConditionId: form.productConditionId,

          productName: form.productName.trim(),

          brand: form.brand.trim() || undefined,
          modelName: form.modelName.trim() || undefined,
          description: form.description.trim() || undefined,

          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),

          isAvailable: form.isAvailable,
          isFeatured: form.isFeatured
        },
        token
      );

      if (selectedImage) {
        await uploadProductImage(Number(id), selectedImage, token);
      }

      setSuccess(result.message);

      setTimeout(() => {
        navigate("/admin/products");
      }, 700);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update product.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
          <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <title>Edit Product</title>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <Link
          to="/admin/products"
          className="inline-flex rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
        >
          ← Back to products
        </Link>

        <div className="mt-8 border-b border-[#d8cdb6] pb-8 dark:border-[#302c24]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Admin Panel
          </p>

          <h1 className="font-display mt-3 text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            Edit Product
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f6758] dark:text-[#a8a093] sm:text-base">
            Update product details, price, stock, availability and product
            image.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6 lg:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Product Category">
              <DropdownField
                value={form.productCategoryId}
                placeholder="Select category"
                options={categories}
                onChange={(value) => updateField("productCategoryId", value)}
              />
            </FormField>

            <FormField label="Product Condition">
              <DropdownField
                value={form.productConditionId}
                placeholder="Select condition"
                options={conditions}
                onChange={(value) => updateField("productConditionId", value)}
              />
            </FormField>

            <FormField label="Product Name">
              <input
                value={form.productName}
                onChange={(event) =>
                  updateField("productName", event.target.value)
                }
                placeholder="Example: LG 43 inch Smart TV"
                className="admin-input"
              />
            </FormField>

            <FormField label="Brand">
              <input
                value={form.brand}
                onChange={(event) => updateField("brand", event.target.value)}
                placeholder="Example: LG"
                className="admin-input"
              />
            </FormField>

            <FormField label="Model Name">
              <input
                value={form.modelName}
                onChange={(event) =>
                  updateField("modelName", event.target.value)
                }
                placeholder="Example: 43LM"
                className="admin-input"
              />
            </FormField>

            <FormField label="Price">
              <input
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                type="number"
                min="0"
                placeholder="Example: 12500"
                className="admin-input"
              />
            </FormField>

            <FormField label="Stock Quantity">
              <input
                value={form.stockQuantity}
                onChange={(event) =>
                  updateField("stockQuantity", event.target.value)
                }
                type="number"
                min="0"
                placeholder="Example: 1"
                className="admin-input"
              />
            </FormField>
          </div>

          <div className="mt-5">
            <ProductImageUpload
              imagePreview={imagePreview}
              imageError={imageError}
              hasNewImage={selectedImage !== null}
              onChange={handleProductImageChange}
              onCancel={cancelImageChange}
            />
          </div>

          <div className="mt-5">
            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Write product condition, working status and important details..."
                className="admin-input min-h-32 resize-none"
              />
            </FormField>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ToggleCard
              checked={form.isAvailable}
              onChange={(checked) => updateField("isAvailable", checked)}
              title="Available"
              description="Show product on public products page."
            />

            <ToggleCard
              checked={form.isFeatured}
              onChange={(checked) => updateField("isFeatured", checked)}
              title="Featured"
              description="Mark as highlighted product."
            />
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              {success}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionButton
              type="submit"
              loading={saving}
              loadingText="Saving..."
              variant="gold"
              fullWidth={false}
              className="min-w-[180px] cursor-pointer shadow-lg shadow-black/10"
            >
              Save Changes
            </ActionButton>

            <Link
              to="/admin/products"
              className="inline-flex min-w-[140px] items-center justify-center rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-6 py-4 text-sm font-black text-[#1f1a12] transition hover:-translate-y-0.5 hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

type FormFieldProps = {
  label: string;
  children: ReactNode;
};

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        {label}
      </span>
      {children}
    </label>
  );
}

type DropdownFieldProps = {
  value: number;
  placeholder: string;
  options: LookUpItem[];
  onChange: (value: number) => void;
};

function DropdownField({
  value,
  placeholder,
  options,
  onChange
}: DropdownFieldProps) {
  const [open, setOpen] = useState<boolean>(false);

  const selectedOption = options.find((option) => option.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-left text-sm font-semibold text-[#1f1a12] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
      >
        <span>{selectedOption?.name || placeholder}</span>

        <svg
          className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] shadow-2xl shadow-black/20 dark:border-[#302c24] dark:bg-[#11110f]">
          <DropdownOption
            active={value === 0}
            onClick={() => {
              onChange(0);
              setOpen(false);
            }}
          >
            {placeholder}
          </DropdownOption>

          {options.map((option) => (
            <DropdownOption
              key={option.id}
              active={value === option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              {option.name}
            </DropdownOption>
          ))}
        </div>
      )}
    </div>
  );
}

type DropdownOptionProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function DropdownOption({ active, onClick, children }: DropdownOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-[#d6b46a] text-[#11110f]"
          : "text-[#1f1a12] hover:bg-[#fff4cc] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712]"
      }`}
    >
      {children}
    </button>
  );
}

type ToggleCardProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
};

function ToggleCard({
  checked,
  onChange,
  title,
  description
}: ToggleCardProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#d6b46a]"
      />

      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>
    </label>
  );
}

type ProductImageUploadProps = {
  imagePreview: string;
  imageError: string;
  hasNewImage: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
};

function ProductImageUpload({
  imagePreview,
  imageError,
  hasNewImage,
  onChange,
  onCancel
}: ProductImageUploadProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        Product Image
      </label>

      {!imagePreview ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#d8cdb6] bg-[#fffaf0] px-4 py-8 text-center transition hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#1a1712]">
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-2xl font-black text-[#7a570f] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            +
          </div>

          <p className="mt-4 text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            Upload product photo
          </p>

          <p className="mt-2 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
            JPG, PNG or WEBP. Max 5MB.
          </p>
        </label>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]">
          <img
            src={imagePreview}
            alt="Product preview"
            className="h-64 w-full object-cover"
          />

          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                {hasNewImage ? "New image selected" : "Current product image"}
              </p>

              <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Choose another image to replace it.
              </p>
            </div>

            <div className="flex gap-2">
              <label className="cursor-pointer rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-2 text-xs font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]">
                Change
                <input
                  type="file"
                  accept="image/*"
                  onChange={onChange}
                  className="hidden"
                />
              </label>

              {hasNewImage && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {imageError && (
        <p className="mt-2 text-sm font-semibold text-red-500">{imageError}</p>
      )}
    </div>
  );
}

export default AdminEditProductPage;
