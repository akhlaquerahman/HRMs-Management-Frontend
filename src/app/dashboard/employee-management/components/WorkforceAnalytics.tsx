import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function WorkforceAnalytics({ data, loading }: { data: any, loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-[300px] border rounded-xl bg-card animate-pulse" />
        <div className="h-[300px] border rounded-xl bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded-xl bg-card shadow-sm p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">{t("Department Distribution")}</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.departmentDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data?.departmentDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-sm p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">{t("Employment Type")}</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.employmentTypeDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {data?.employmentTypeDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
