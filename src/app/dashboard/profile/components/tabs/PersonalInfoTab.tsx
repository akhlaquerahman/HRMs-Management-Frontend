"use client";

import { useState } from "react";
import { formatDate } from '@/lib/dateUtils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios";

export default function PersonalInfoTab({ data, refetch }: { data: any, refetch: () => void }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    gender: data?.employee?.gender || "",
    dob: data?.employee?.dob ? new Date(data.employee.dob).toISOString().split('T')[0] : "",
    bloodGroup: data?.employee?.bloodGroup || "",
    maritalStatus: data?.employee?.maritalStatus || "",
    nationality: data?.employee?.nationality || "",
  });

  const handleSave = async () => {
    try {
      await api.put("/profile/personal", formData);
      refetch();
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update personal information");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-lg font-semibold text-primary">{t("Personal Information")}</h3>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>{t("Edit Info")}</Button>
        ) : (
          <div className="space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>{t("Cancel")}</Button>
            <Button size="sm" onClick={handleSave}>{t("Save Changes")}</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("First Name")}</label>
          {isEditing ? <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /> : <p className="font-medium">{formData.firstName || "—"}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("Last Name")}</label>
          {isEditing ? <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /> : <p className="font-medium">{formData.lastName || "—"}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("Gender")}</label>
          {isEditing ? (
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          ) : <p className="font-medium">{formData.gender || "—"}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("Date of Birth")}</label>
          {isEditing ? <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /> : <p className="font-medium">{formData.dob ? formatDate(formData.dob) : "—"}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("Blood Group")}</label>
          {isEditing ? <Input value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} /> : <p className="font-medium">{formData.bloodGroup || "—"}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("Marital Status")}</label>
          {isEditing ? (
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})}>
              <option value="">Select Status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
            </select>
          ) : <p className="font-medium">{formData.maritalStatus || "—"}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t("Nationality")}</label>
          {isEditing ? <Input value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} /> : <p className="font-medium">{formData.nationality || "—"}</p>}
        </div>
      </div>
    </div>
  );
}
