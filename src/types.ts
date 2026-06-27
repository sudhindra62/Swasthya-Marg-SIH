export type Role = 'hospital' | 'sub_admin' | 'dist_admin' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  name: string;
  district?: string;
  state?: string;
  isApproved?: boolean;
}

export interface Patient {
  id: string;
  hospitalId: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  address: string;
  diagnosis: string;
  aadhaar?: string;
  createdAt: number;
}

export interface Scheme {
  id: string;
  title: string;
  description: string;
  eligibility: string;
  benefits: string;
  createdAt: number;
}

export interface SchemeApplication {
  id: string;
  patientId: string;
  hospitalId: string;
  schemeId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: number;
  updatedAt: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  district: string;
  state: string;
}

export interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  createdAt: number;
  district?: string;
  state?: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: number;
}
