'use client';

import { useState } from 'react';
import { getDepartmentOptions, getAreasByDepartment, getStaffByDepartmentAndArea } from '@/lib/departments';

interface Step3BSelectDepartmentProps {
  subject: string;
  description: string;
  onSubmit: (data: {
    subject: string;
    description: string;
    department: string;
    area: string;
    staff: string;
  }) => void;
  onBack: () => void;
}

export function Step3BSelectDepartment({
  subject,
  description,
  onSubmit,
  onBack,
}: Step3BSelectDepartmentProps) {
  const [formData, setFormData] = useState({
    department: '',
    area: '',
    staff: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const departments = getDepartmentOptions();
  const areas = formData.department ? getAreasByDepartment(formData.department) : [];
  const staff = formData.department && formData.area ? getStaffByDepartmentAndArea(formData.department, formData.area) : [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.department) newErrors.department = 'Debe seleccionar un departamento';
    if (!formData.area) newErrors.area = 'Debe seleccionar un área';
    if (!formData.staff) newErrors.staff = 'Debe seleccionar un funcionario';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      subject,
      description,
      department: formData.department,
      area: formData.area,
      staff: formData.staff,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Seleccionar Departamento</h2>
        <p className="mt-2 text-muted-foreground">
          Indique el departamento relacionado con su consulta
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Departamento *</label>
          <select
            value={formData.department}
            onChange={(e) => {
              setFormData({ ...formData, department: e.target.value, area: '', staff: '' });
              if (errors.department) setErrors({ ...errors, department: '' });
            }}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Seleccione un departamento</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
        </div>

        {formData.department && (
          <div>
            <label className="block text-sm font-medium text-foreground">Área *</label>
            <select
              value={formData.area}
              onChange={(e) => {
                setFormData({ ...formData, area: e.target.value, staff: '' });
                if (errors.area) setErrors({ ...errors, area: '' });
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccione un área</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            {errors.area && <p className="mt-1 text-sm text-red-500">{errors.area}</p>}
          </div>
        )}

        {formData.area && (
          <div>
            <label className="block text-sm font-medium text-foreground">Funcionario a Cargo *</label>
            <select
              value={formData.staff}
              onChange={(e) => {
                setFormData({ ...formData, staff: e.target.value });
                if (errors.staff) setErrors({ ...errors, staff: '' });
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccione un funcionario</option>
              {staff.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
            {errors.staff && <p className="mt-1 text-sm text-red-500">{errors.staff}</p>}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Atrás
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}
