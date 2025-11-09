import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Vendor } from "@/types";
import { toast } from "sonner";

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/vendors");
      return data as Vendor[];
    },
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/vendors/${id}`);
      return data as Vendor;
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorData: Partial<Vendor>) => {
      const { data } = await api.post("/api/v1/vendors", vendorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create vendor");
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...vendorData }: Partial<Vendor> & { id: string }) => {
      const { data } = await api.put(`/api/v1/vendors/${id}`, vendorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update vendor");
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete vendor");
    },
  });
}

export function useVerifyVendorAML() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/v1/vendors/${id}/verify-aml`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor AML verified successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to verify vendor AML");
    },
  });
}

export function useUpdateVendorSalesInstruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      instructedPropertyId,
      instructionType,
      agreedCommission,
      minimumFee,
      contractLengthWeeks,
    }: {
      vendorId: string;
      instructedPropertyId: string;
      instructionType: string;
      agreedCommission: number;
      minimumFee: number;
      contractLengthWeeks: number;
    }) => {
      const { data } = await api.put(
        `/api/v1/vendors/${vendorId}/sales-instruction`,
        null,
        {
          params: {
            instructed_property_id: instructedPropertyId,
            instruction_type: instructionType,
            agreed_commission: agreedCommission,
            minimum_fee: minimumFee,
            contract_length_weeks: contractLengthWeeks,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Sales instruction updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update sales instruction");
    },
  });
}

export function useUpdateVendorAMLComprehensive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      amlStatus,
      amlAgentName,
      amlProviderUsed,
      isPep,
      proofOfOwnershipUploaded,
    }: {
      vendorId: string;
      amlStatus: string;
      amlAgentName: string;
      amlProviderUsed?: string;
      isPep?: boolean;
      proofOfOwnershipUploaded?: boolean;
    }) => {
      const { data } = await api.put(
        `/api/v1/vendors/${vendorId}/aml-comprehensive`,
        null,
        {
          params: {
            aml_status: amlStatus,
            aml_agent_name: amlAgentName,
            aml_provider_used: amlProviderUsed,
            is_pep: isPep,
            proof_of_ownership_uploaded: proofOfOwnershipUploaded,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("AML information updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update AML information");
    },
  });
}

export function useUpdateVendorConveyancer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      conveyancerName,
      conveyancerFirm,
      conveyancerContact,
    }: {
      vendorId: string;
      conveyancerName: string;
      conveyancerFirm: string;
      conveyancerContact: string;
    }) => {
      const { data } = await api.put(
        `/api/v1/vendors/${vendorId}/conveyancer`,
        null,
        {
          params: {
            conveyancer_name: conveyancerName,
            conveyancer_firm: conveyancerFirm,
            conveyancer_contact: conveyancerContact,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Conveyancer information updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update conveyancer information");
    },
  });
}

export function useVendorsWithAMLExpiringSoon(daysThreshold: number = 30) {
  return useQuery({
    queryKey: ["vendors", "aml-expiring", daysThreshold],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/vendors/aml/expiring-soon", {
        params: { days_threshold: daysThreshold },
      });
      return data as Vendor[];
    },
  });
}

export function useVendorsByInstructionType(instructionType: string) {
  return useQuery({
    queryKey: ["vendors", "instruction-type", instructionType],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/vendors/search/instruction-type", {
        params: { instruction_type: instructionType },
      });
      return data as Vendor[];
    },
    enabled: !!instructionType,
  });
}

export function useVendorsWithContractsExpiringSoon(weeksThreshold: number = 4) {
  return useQuery({
    queryKey: ["vendors", "contracts-expiring", weeksThreshold],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/vendors/contracts/expiring-soon", {
        params: { weeks_threshold: weeksThreshold },
      });
      return data as Vendor[];
    },
  });
}

export function useUpdateVendorMarketingConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, consent }: { vendorId: string; consent: boolean }) => {
      const { data } = await api.put(
        `/api/v1/vendors/${vendorId}/marketing-consent`,
        null,
        {
          params: { consent },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Marketing consent updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update marketing consent");
    },
  });
}

export function useVendorsByLeadSource(leadSource: string) {
  return useQuery({
    queryKey: ["vendors", "lead-source", leadSource],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/vendors/source/${leadSource}`);
      return data as Vendor[];
    },
    enabled: !!leadSource,
  });
}

