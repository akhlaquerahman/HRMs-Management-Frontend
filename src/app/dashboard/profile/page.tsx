"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  UserCircle, Building, Globe, Camera, Loader2, Briefcase, UserCheck, 
  BadgeCheck, ShieldCheck, Lock, Key, Mail, Phone, MapPin, CreditCard, 
  Sparkles, CheckCircle2, AlertCircle, Heart, User, ShieldAlert,
  Smartphone, Calendar, Eye, EyeOff, Save, ExternalLink
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState("overview");

  // Personal Info Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    roleName: "",
    profilePic: "",
    gender: "Male",
    dob: "",
    bloodGroup: "O+",
    maritalStatus: "Single",
    nationality: "Indian",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
  });

  // Bank Info State
  const [bankData, setBankData] = useState({
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: ""
  });
  const [showAccountNo, setShowAccountNo] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Security / Password State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ text: "", type: "" });

  // Avatar Upload State
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  // Company Details State
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMsg, setCompanyMsg] = useState({ text: "", type: "" });
  const [personalMsg, setPersonalMsg] = useState({ text: "", type: "" });

  const roleName = user?.role?.toUpperCase() || '';
  const canEditCompany = roleName.includes('HR') || roleName.includes('SUPER') || roleName.includes('ADMIN');

  // Fetch Full Profile
  const { data: profileRes, isLoading: profileLoading } = useQuery({ 
    queryKey: ["auth_profile_full"], 
    queryFn: async () => {
      try {
        const res = await api.get("/profile/full");
        return res.data;
      } catch (err) {
        const fallbackRes = await api.get("/profile");
        return fallbackRes.data;
      }
    }
  });

  // Fetch Company Data
  const { data: companyRes, isLoading: companyLoading } = useQuery({
    queryKey: ["company"],
    queryFn: async () => (await api.get("/company")).data
  });

  const profileDataObj = profileRes?.data?.data || profileRes?.data || profileRes;
  const empData = profileDataObj?.employee || profileDataObj?.Employee || (user as any)?.employee;
  const empId = empData?.employeeId || empData?.id || '';
  const empDesignation = empData?.designation?.name || empData?.designation?.title || empData?.designationName || 'Corporate Professional';
  const empDepartment = empData?.department?.name || empData?.departmentName || 'General Operations';
  const isDeptHead = empData?.department?.managerId === empData?.id || (empData?.id && empData?.department?.manager?.id === empData?.id);
  const empManager = isDeptHead
    ? "Department Head"
    : empData?.manager 
      ? `${empData.manager.user?.firstName || empData.manager.firstName || ''} ${empData.manager.user?.lastName || empData.manager.lastName || ''}`.trim()
      : (empData?.managerName || 'Department Executive');

  useEffect(() => {
    const pData = profileRes?.data?.data || profileRes?.data;
    if (pData) {
      const emp = pData.employee || {};
      setFormData({
        firstName: pData.firstName || "",
        lastName: pData.lastName || "",
        phone: pData.phone || emp.phone || "",
        email: pData.email || "",
        roleName: pData.role?.name || "EMPLOYEE",
        profilePic: pData.profilePic || "",
        gender: emp.gender || "Male",
        dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : "",
        bloodGroup: emp.bloodGroup || "O+",
        maritalStatus: emp.maritalStatus || "Single",
        nationality: emp.nationality || "Indian",
        address: emp.address || "",
        city: emp.city || "",
        state: emp.state || "",
        country: emp.country || "India",
        postalCode: emp.postalCode || "",
        emergencyContactName: emp.emergencyContactName || "",
        emergencyContactRelation: emp.emergencyContactRelation || "",
        emergencyContactPhone: emp.emergencyContactPhone || "",
      });

      setBankData({
        bankName: emp.bankName || "",
        accountNumber: emp.accountNumber || "",
        ifsc: emp.ifsc || "",
        upiId: emp.upiId || ""
      });

      if (pData.profilePic !== user?.profilePic || pData.firstName !== user?.firstName) {
        updateUser({ 
          profilePic: pData.profilePic,
          firstName: pData.firstName,
          lastName: pData.lastName
        });
      }
    }

    const cData = companyRes?.data?.data || companyRes?.data;
    if (cData) {
      setCompanyName(cData.companyName || "");
      setCompanyWebsite(cData.companyWebsite || "");
      setCompanyAddress(cData.companyAddress || "");
      setCompanyPhone(cData.companyPhone || "");
    }
  }, [profileRes, companyRes]);

  // Handlers
  const handlePersonalUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalMsg({ text: "", type: "" });
    try {
      await api.put("/profile/personal", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        maritalStatus: formData.maritalStatus,
        nationality: formData.nationality
      });

      await api.put("/profile/contact", {
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelation: formData.emergencyContactRelation,
        emergencyContactPhone: formData.emergencyContactPhone
      });

      updateUser({ firstName: formData.firstName, lastName: formData.lastName });
      queryClient.invalidateQueries({ queryKey: ["auth_profile_full"] });
      setPersonalMsg({ text: "Profile details updated successfully!", type: "success" });
    } catch (err: any) { 
      setPersonalMsg({ text: err?.response?.data?.message || "Failed to update profile", type: "error" });
    }
  };

  const handleBankUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      await api.put("/profile/bank", bankData);
      queryClient.invalidateQueries({ queryKey: ["auth_profile_full"] });
      alert("Bank details updated successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update bank details");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage({ text: "", type: "" });

    if (securityData.newPassword !== securityData.confirmPassword) {
      setSecurityMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    if (securityData.newPassword.length < 6) {
      setSecurityMessage({ text: "Password must be at least 6 characters long", type: "error" });
      return;
    }

    setIsSavingSecurity(true);
    try {
      await api.put("/profile/security", {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSecurityMessage({ text: "Password updated successfully!", type: "success" });
    } catch (err: any) {
      setSecurityMessage({ text: err?.response?.data?.message || "Failed to update password", type: "error" });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleProfilePicUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    setIsUploadingPic(true);
    try {
      const res = await api.post('/profile/picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newPicUrl = res.data.data.profilePic;
      setFormData(prev => ({ ...prev, profilePic: newPicUrl }));
      updateUser({ profilePic: newPicUrl });
      queryClient.invalidateQueries({ queryKey: ["auth_profile_full"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingPic(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    setCompanyMsg({ text: "", type: "" });
    try {
      await api.put("/company", { companyName, companyWebsite, companyAddress, companyPhone });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      setCompanyMsg({ text: "Company details updated successfully!", type: "success" });
    } catch (err: any) {
      setCompanyMsg({ text: err?.response?.data?.message || "Failed to update company details", type: "error" });
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Profile Completeness calculation
  const completenessFields = [
    formData.firstName, formData.lastName, formData.phone, formData.email,
    formData.address, formData.city, bankData.accountNumber, bankData.bankName
  ];
  const completedCount = completenessFields.filter(Boolean).length;
  const profileCompleteness = Math.round((completedCount / completenessFields.length) * 100);

  if (profileLoading || companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading Executive Profile & Workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      {/* Top Header */}
      <PageHeader 
        title={t("Executive Profile Hub")} 
        description={t("Manage your individual profile identity, corporate credentials, security controls, and tenant settings.")} 
        showCreate={false}
        showImport={false}
        showExport={false}
        showSearch={false}
        showFilters={false}
      />

      {/* Hero Banner Header Card */}
      <div className="relative rounded-2xl overflow-hidden border bg-card shadow-lg">
        {/* Ambient Gradient Backdrop */}
        <div className="h-44 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 relative p-6 flex justify-between items-start">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative z-10 flex items-center gap-2 text-white/90 text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Building className="w-3.5 h-3.5" />
            <span>{companyName || "Enterprise Tenant"}</span>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 backdrop-blur-md px-3 py-1 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active Account
            </Badge>
          </div>
        </div>

        {/* Profile Content Details */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-16 z-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar Uploader */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('profilePicInput')?.click()}>
              <div className="w-28 h-28 rounded-2xl ring-4 ring-background bg-card shadow-xl overflow-hidden flex items-center justify-center relative border">
                {isUploadingPic ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : formData.profilePic ? (
                  <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-24 h-24 text-primary/80" />
                )}
                {!isUploadingPic && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-1">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Update</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="profilePicInput" 
                className="hidden" 
                accept="image/*"
                onChange={handleProfilePicUpdate}
              />
            </div>

            {/* Name & Headline */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {formData.firstName} {formData.lastName}
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase tracking-wider">
                  {formData.roleName}
                </Badge>
                {empId && (
                  <Badge variant="outline" className="font-mono text-xs font-semibold bg-muted/50">
                    {empId}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary/80" />
                <span>{empDesignation}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{empDepartment}</span>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {formData.email}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("security")}
              className="gap-1.5 text-xs font-semibold"
            >
              <Lock className="w-3.5 h-3.5 text-primary" />
              Security Settings
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90"
            >
              <User className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Completeness Card */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Profile Completeness</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{profileCompleteness}%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Excellent</span>
          </div>
          <Progress value={profileCompleteness} className="h-2" />
        </div>

        {/* Access Tier Card */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Access Permission Tier</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-foreground">{formData.roleName}</span>
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 border-blue-300">
              Verified
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">Authorized for company resources</p>
        </div>

        {/* Org Department Head */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Supervisor / Manager</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground truncate max-w-[150px]">{empManager}</span>
            <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-700 border-indigo-300">
              Reporting
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">{empDepartment}</p>
        </div>

        {/* Security Health */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Security Health</span>
            <Lock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Secured</span>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 text-[10px]">
              Encrypted
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">Password & Sessions protected</p>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border p-1 rounded-xl w-full justify-start overflow-x-auto gap-1">
          <TabsTrigger value="overview" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-3.5 h-3.5" />
            Personal & Contact Info
          </TabsTrigger>
          <TabsTrigger value="employment" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Briefcase className="w-3.5 h-3.5" />
            Employment & Org Details
          </TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CreditCard className="w-3.5 h-3.5" />
            Bank & Payroll
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lock className="w-3.5 h-3.5" />
            Security & Credentials
          </TabsTrigger>
          <TabsTrigger value="company" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building className="w-3.5 h-3.5" />
            Company & Tenant
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PERSONAL & CONTACT */}
        <TabsContent value="overview" className="space-y-6">
          <form onSubmit={handlePersonalUpdate} className="space-y-6">
            {personalMsg.text && (
              <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                personalMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {personalMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                <span>{personalMsg.text}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Details Box */}
              <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-3 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">First Name *</label>
                    <Input 
                      required 
                      className="h-9 text-xs" 
                      value={formData.firstName} 
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Last Name *</label>
                    <Input 
                      required 
                      className="h-9 text-xs" 
                      value={formData.lastName} 
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Gender</label>
                    <select 
                      className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Date of Birth</label>
                    <Input 
                      type="date"
                      className="h-9 text-xs" 
                      value={formData.dob} 
                      onChange={e => setFormData({ ...formData, dob: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Blood Group</label>
                    <select 
                      className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                      value={formData.bloodGroup}
                      onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Marital Status</label>
                    <select 
                      className="flex h-9 w-full rounded-md border bg-background px-3 text-xs"
                      value={formData.maritalStatus}
                      onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Nationality</label>
                    <Input 
                      className="h-9 text-xs" 
                      value={formData.nationality} 
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Address Box */}
              <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact & Communication
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    Email Address
                    <span className="text-[10px] text-muted-foreground font-normal">(System Locked)</span>
                  </label>
                  <Input 
                    disabled 
                    value={formData.email} 
                    className="h-9 text-xs bg-muted/60 font-medium text-muted-foreground cursor-not-allowed" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Mobile Number *</label>
                  <Input 
                    required 
                    placeholder="+91 98765 43210"
                    className="h-9 text-xs" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Residential Address</label>
                  <Input 
                    placeholder="Street, Building No."
                    className="h-9 text-xs" 
                    value={formData.address} 
                    onChange={e => setFormData({ ...formData, address: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">City</label>
                    <Input 
                      className="h-9 text-xs" 
                      value={formData.city} 
                      onChange={e => setFormData({ ...formData, city: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">State</label>
                    <Input 
                      className="h-9 text-xs" 
                      value={formData.state} 
                      onChange={e => setFormData({ ...formData, state: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Postal Code</label>
                    <Input 
                      className="h-9 text-xs" 
                      value={formData.postalCode} 
                      onChange={e => setFormData({ ...formData, postalCode: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b pb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Emergency Contact Directory
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Contact Full Name</label>
                  <Input 
                    placeholder="e.g. Parent / Spouse Name"
                    className="h-9 text-xs" 
                    value={formData.emergencyContactName} 
                    onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Relationship</label>
                  <Input 
                    placeholder="e.g. Spouse / Father / Sister"
                    className="h-9 text-xs" 
                    value={formData.emergencyContactRelation} 
                    onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Emergency Phone No.</label>
                  <Input 
                    placeholder="+91 99999 88888"
                    className="h-9 text-xs" 
                    value={formData.emergencyContactPhone} 
                    onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" className="bg-primary hover:bg-primary/90 font-semibold px-6 gap-2">
                <Save className="w-4 h-4" />
                Save Profile Changes
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TAB 2: EMPLOYMENT & ORG DETAILS */}
        <TabsContent value="employment" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Employment Credentials
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    Employee ID
                    <span className="text-[10px] text-muted-foreground font-normal">(Locked)</span>
                  </label>
                  <Input disabled value={empId || 'N/A'} className="h-9 text-xs bg-muted/60 font-mono font-bold text-foreground" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    Designation
                    <span className="text-[10px] text-muted-foreground font-normal">(Locked)</span>
                  </label>
                  <Input disabled value={empDesignation} className="h-9 text-xs bg-muted/60 font-semibold text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    Department
                    <span className="text-[10px] text-muted-foreground font-normal">(Locked)</span>
                  </label>
                  <Input disabled value={empDepartment} className="h-9 text-xs bg-muted/60 font-semibold text-foreground" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    Assigned Manager
                    <span className="text-[10px] text-muted-foreground font-normal">(Locked)</span>
                  </label>
                  <Input disabled value={empManager} className="h-9 text-xs bg-muted/60 font-semibold text-foreground" />
                </div>
              </div>
            </div>

            {/* Hierarchy Card */}
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Organizational Reporting
                </h3>

                <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{empManager}</h4>
                      <p className="text-xs text-muted-foreground">Reporting Lead / Head of Department</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-muted/50">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                      Active Supervisor
                    </Badge>
                    <span>Direct line reports & approvals</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                To request transfer or designation updates, contact your HR Administrator.
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: PAYROLL & BANK */}
        <TabsContent value="payroll" className="space-y-6">
          <form onSubmit={handleBankUpdate} className="space-y-6">
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Account & Salary Transfer Credentials
                </h3>
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 mr-1" /> KYC Verified
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Bank Name *</label>
                  <Input 
                    required 
                    placeholder="e.g. HDFC Bank / ICICI Bank / State Bank of India"
                    className="h-9 text-xs" 
                    value={bankData.bankName} 
                    onChange={e => setBankData({ ...bankData, bankName: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    Account Number *
                    <button 
                      type="button" 
                      onClick={() => setShowAccountNo(!showAccountNo)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      {showAccountNo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showAccountNo ? "Hide" : "Show"}
                    </button>
                  </label>
                  <Input 
                    required 
                    type={showAccountNo ? "text" : "password"}
                    placeholder="Enter Account Number"
                    className="h-9 text-xs font-mono" 
                    value={bankData.accountNumber} 
                    onChange={e => setBankData({ ...bankData, accountNumber: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">IFSC Code *</label>
                  <Input 
                    required 
                    placeholder="e.g. HDFC0001234"
                    className="h-9 text-xs font-mono uppercase" 
                    value={bankData.ifsc} 
                    onChange={e => setBankData({ ...bankData, ifsc: e.target.value.toUpperCase() })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">UPI ID (Optional)</label>
                  <Input 
                    placeholder="e.g. username@okhdfcbank"
                    className="h-9 text-xs" 
                    value={bankData.upiId} 
                    onChange={e => setBankData({ ...bankData, upiId: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" disabled={isSavingBank} className="bg-primary hover:bg-primary/90 font-semibold px-6 gap-2">
                  {isSavingBank && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Bank Details
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        {/* TAB 4: SECURITY & CREDENTIALS */}
        <TabsContent value="security" className="space-y-6">
          <form onSubmit={handleSecurityUpdate} className="space-y-6">
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Change Password & Authentication Security
              </h3>

              {securityMessage.text && (
                <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  securityMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {securityMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                  <span>{securityMessage.text}</span>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Current Password *</label>
                  <Input 
                    type="password"
                    required 
                    placeholder="••••••••"
                    className="h-9 text-xs" 
                    value={securityData.currentPassword} 
                    onChange={e => setSecurityData({ ...securityData, currentPassword: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">New Password *</label>
                  <Input 
                    type="password"
                    required 
                    placeholder="Min 6 characters"
                    className="h-9 text-xs" 
                    value={securityData.newPassword} 
                    onChange={e => setSecurityData({ ...securityData, newPassword: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Confirm New Password *</label>
                  <Input 
                    type="password"
                    required 
                    placeholder="Re-type new password"
                    className="h-9 text-xs" 
                    value={securityData.confirmPassword} 
                    onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" disabled={isSavingSecurity} className="bg-primary hover:bg-primary/90 font-semibold px-6 gap-2">
                  {isSavingSecurity && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Security Password
                </Button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Active Sessions & Login Audit
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Current Desktop Session (Web Browser)</h4>
                    <p className="text-[11px] text-muted-foreground">Windows 11 • Chrome / Edge • Active Now</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                  Current Session
                </Badge>
              </div>
            </div>
          </form>
        </TabsContent>

        {/* TAB 5: COMPANY TENANT DETAILS */}
        <TabsContent value="company" className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company Organization Profile & Tenant Workspace
              </h3>
              {canEditCompany ? (
                <Badge className="bg-blue-500/15 text-blue-700 border-blue-300 text-xs">
                  HR Admin Manager Mode
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Read Only Employee View
                </Badge>
              )}
            </div>

            {companyMsg.text && (
              <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                companyMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {companyMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                <span>{companyMsg.text}</span>
              </div>
            )}

            {canEditCompany ? (
              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Company Name *</label>
                    <Input 
                      required 
                      placeholder="Enterprise Company Name"
                      className="h-9 text-xs" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Company Website</label>
                    <Input 
                      placeholder="https://company.com"
                      className="h-9 text-xs" 
                      value={companyWebsite} 
                      onChange={e => setCompanyWebsite(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Headquarters Address</label>
                    <Input 
                      placeholder="Full Corporate Address"
                      className="h-9 text-xs" 
                      value={companyAddress} 
                      onChange={e => setCompanyAddress(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Corporate Support Contact Phone</label>
                    <Input 
                      placeholder="+91 11 4000 5000"
                      className="h-9 text-xs" 
                      value={companyPhone} 
                      onChange={e => setCompanyPhone(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" disabled={isSavingCompany} className="bg-primary hover:bg-primary/90 font-semibold px-6 gap-2">
                    {isSavingCompany && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Organization Settings
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-xs text-muted-foreground block font-medium">Company Name</span>
                    <span className="text-sm font-bold text-foreground">{companyName || "N/A"}</span>
                  </div>
                  <div className="border-b pb-2">
                    <span className="text-xs text-muted-foreground block font-medium">Official Website</span>
                    {companyWebsite ? (
                      <a 
                        href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 mt-0.5"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {companyWebsite}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-foreground font-semibold">N/A</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-xs text-muted-foreground block font-medium">Corporate Address</span>
                    <span className="text-sm font-semibold text-foreground">{companyAddress || "N/A"}</span>
                  </div>
                  <div className="border-b pb-2">
                    <span className="text-xs text-muted-foreground block font-medium">Corporate Contact</span>
                    <span className="text-sm font-semibold text-foreground">{companyPhone || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
