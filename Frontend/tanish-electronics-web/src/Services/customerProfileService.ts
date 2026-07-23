import { apiClient } from "./apiClient";

export type CustomerAddress = {
  customerAddressId: number;
  label?: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type CustomerProfile = {
  appUserId: number;
  customerId?: number | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  isProfileCompleted: boolean;
  addresses: CustomerAddress[];
};

export type UpdateCustomerProfile = {
  fullName: string;
  phoneNumber: string;
};

export type UpsertCustomerAddress = {
  label?: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export async function getCustomerProfile(token: string) {
  return await apiClient<CustomerProfile>("/CustomerProfile", {
    authToken: token
  });
}

export async function updateCustomerProfile(
  data: UpdateCustomerProfile,
  token: string
) {
  return await apiClient<CustomerProfile>("/CustomerProfile/details", {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(data)
  });
}

export async function addCustomerAddress(
  data: UpsertCustomerAddress,
  token: string
) {
  return await apiClient<CustomerAddress>("/CustomerProfile/addresses", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data)
  });
}

export async function setDefaultCustomerAddress(
  addressId: number,
  token: string
) {
  return await apiClient<CustomerAddress>(
    `/CustomerProfile/addresses/${addressId}/default`,
    {
      method: "PUT",
      authToken: token
    }
  );
}

export async function deleteCustomerAddress(addressId: number, token: string) {
  return await apiClient<{ message: string }>(
    `/CustomerProfile/addresses/${addressId}`,
    {
      method: "DELETE",
      authToken: token
    }
  );
}
export async function updateCustomerAddress(
  addressId: number,
  data: UpsertCustomerAddress,
  token: string
) {
  return await apiClient<CustomerAddress>(
    `/CustomerProfile/addresses/${addressId}`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify(data)
    }
  );
}
