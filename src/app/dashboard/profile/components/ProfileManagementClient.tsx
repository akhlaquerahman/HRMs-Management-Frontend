"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from "@/components/shared/PageHeader";

import { UserProfileCard } from './UserProfileCard';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { CompanyDetailsForm } from './CompanyDetailsForm';
import { BankDetailsForm } from './BankDetailsForm';
import { ImageCropperModal } from './ImageCropperModal';

export function ProfileManagementClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  
  const [formData, setFormData] = useState({ 
    firstName: "", 
    lastName: "", 
    phone: "", 
    email: "", 
    roleName: "", 
    profilePic: "" 
  });
  const [employeeData, setEmployeeData] = useState<any>(null);

  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  
  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Bank Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSavingBank, setIsSavingBank] = useState(false);

  const roleName = user?.role?.toUpperCase() || '';
  const canEditCompany = roleName.includes('HR') || roleName.includes('SUPER') || roleName.includes('ADMIN');

  const { data: profileRes, isLoading: profileLoading } = useQuery({ 
    queryKey: ["auth_profile"], 
    queryFn: async () => (await api.get("/profile/full")).data 
  });

  const { data: companyRes, isLoading: companyLoading } = useQuery({
    queryKey: ["company"],
    queryFn: async () => (await api.get("/company")).data
  });

  useEffect(() => {
    if (profileRes?.data) {
      setFormData({
        firstName: profileRes.data.firstName || "",
        lastName: profileRes.data.lastName || "",
        phone: profileRes.data.phone || "",
        email: profileRes.data.email || "",
        roleName: profileRes.data.role?.name || "EMPLOYEE",
        profilePic: profileRes.data.profilePic || "",
      });
      setEmployeeData(profileRes.data.employee || null);

      if (profileRes.data.profilePic !== user?.profilePic || profileRes.data.firstName !== user?.firstName) {
        updateUser({ 
          profilePic: profileRes.data.profilePic,
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName
        });
      }

      if (profileRes.data.employee) {
        setBankName(profileRes.data.employee.bankName || "");
        setAccountNumber(profileRes.data.employee.accountNumber || "");
      }
    }
    if (companyRes?.data) {
      setCompanyName(companyRes.data.companyName || "");
      setCompanyWebsite(companyRes.data.companyWebsite || "");
      setCompanyAddress(companyRes.data.companyAddress || "");
      setCompanyPhone(companyRes.data.companyPhone || "");
    }
  }, [profileRes, companyRes]);

  const handleUpdatePersonal = async (e: React.FormEvent, data?: { firstName: string, lastName: string, phone: string }) => {
    e.preventDefault();
    setIsSavingPersonal(true);
    
    // Fallback to local formData if not provided by react-hook-form
    const updatePayload = data || formData;
    
    try {
      await api.put("/profile", {
        firstName: updatePayload.firstName,
        lastName: updatePayload.lastName,
        phone: updatePayload.phone
      });
      updateUser({ firstName: updatePayload.firstName, lastName: updatePayload.lastName });
      queryClient.invalidateQueries({ queryKey: ["auth_profile"] });
      alert("Profile updated successfully!");
    } catch (err: any) { 
      alert(err?.response?.data?.message || "Error updating profile"); 
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropperSrc(reader.result?.toString() || '');
        setIsCropperOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; // reset input
    }
  };

  const handleUploadCroppedPic = async (blob: Blob) => {
    const uploadData = new FormData();
    uploadData.append('file', blob, 'profile_pic.jpg');
    
    setIsUploadingPic(true);
    try {
      const res = await api.post('/profile/picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newPicUrl = res.data.data.profilePic;
      setFormData(prev => ({ ...prev, profilePic: newPicUrl }));
      updateUser({ profilePic: newPicUrl });
      queryClient.invalidateQueries({ queryKey: ["auth_profile"] });
      setIsCropperOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingPic(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      await api.put("/company", { companyName, companyWebsite, companyAddress, companyPhone });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      alert("Company details updated successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error updating company details");
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      await api.put("/profile/bank", {
        bankName,
        accountNumber
      });
      queryClient.invalidateQueries({ queryKey: ["auth_profile"] });
      alert("Bank details updated successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error updating bank details");
    } finally {
      setIsSavingBank(false);
    }
  };

  if (profileLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto pb-4">
      <PageHeader 
        title={t("My Profile")} 
        description={t("Manage your personal account settings and company details.")} 
        showCreate={false}
        showImport={false}
        showExport={false}
        showSearch={false}
        showFilters={false}
      />
      
      <div className="grid lg:grid-cols-4 gap-4 items-start">
        
        {/* Left Column - Avatar & Role summary */}
        <div className="lg:col-span-1 h-full">
          <UserProfileCard 
            firstName={formData.firstName}
            lastName={formData.lastName}
            email={formData.email}
            roleName={employeeData?.designation?.name || formData.roleName}
            profilePic={formData.profilePic}
            isUploadingPic={isUploadingPic}
            onProfilePicChange={handleFileSelect}
          />
        </div>

        {/* Right Column - Personal Details Form */}
        <div className="lg:col-span-3 h-full">
          <PersonalDetailsForm 
            formData={formData}
            employeeData={employeeData}
            setFormData={setFormData}
            onSubmit={handleUpdatePersonal}
            isSaving={isSavingPersonal}
          />
        </div>

      </div>

      <div className="mt-0 grid lg:grid-cols-2 gap-4">
        <CompanyDetailsForm 
          canEditCompany={canEditCompany}
          companyName={companyName}
          setCompanyName={setCompanyName}
          companyWebsite={companyWebsite}
          setCompanyWebsite={setCompanyWebsite}
          companyAddress={companyAddress}
          setCompanyAddress={setCompanyAddress}
          companyPhone={companyPhone}
          setCompanyPhone={setCompanyPhone}
          onSubmit={handleUpdateCompany}
          isSaving={isSavingCompany}
        />
        
        <BankDetailsForm 
          bankName={bankName}
          setBankName={setBankName}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          onSubmit={handleUpdateBank}
          isSaving={isSavingBank}
        />
      </div>

      <ImageCropperModal 
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={cropperSrc}
        onCropComplete={handleUploadCroppedPic}
        isUploading={isUploadingPic}
      />
    </div>
  );
}
