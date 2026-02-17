
import type { LucideIcon } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
};

export type Benefit = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type EventType = 'Service' | 'Social' | 'Meeting' | 'Fundraiser';

export type Event = {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO string
  location: string;
  type: EventType;
  rsvpEnabled?: boolean;
};

export type Member = {
  id:string;
  firstName: string;
  lastName: string;
  grade: number;
  email: string;
  positionId: string;
};

export type ServiceVolunteer = {
  rank: number;
  name: string;
  hours: number;
};

export type ServiceHourEntry = {
  month: string;
  "Service Hours": number;
};

export type PhotoCategory = 'Service' | 'Academics' | 'Social' | 'Ceremonies';

export type Photo = {
  id: string;
  title: string;
  description: string;
  category: PhotoCategory;
  imageUrl: string;
  createdAt: string; // ISO string
  order?: number;
  names?: string[];
};

export type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  email: string;
  position: string;
  bio?: string;
  imageUrl?: string;
  order?: number;
  personalUrl?: string;
};

export type HomePageContent = {
  announcementText: string;
};

export type GallerySettings = {
  isTitleRequired?: boolean;
  isDescriptionRequired?: boolean;
  isNamesRequired?: boolean;
};
