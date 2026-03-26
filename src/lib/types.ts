
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

export type EventType = 'Meeting' | 'Service' | 'Fundraiser' | 'Social';

export type Event = {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO string
  endTime?: string; // HH:mm format
  location: string;
  types: EventType[];
  rsvpEnabled?: boolean;
  albumId?: string;
};

export type Member = {
  id: string; // UID
  memberId: string; // Random 5-digit identifier
  firstName: string;
  lastName: string;
  grade: number;
  email: string;
  totalHours?: number;
};

export type ServiceHourStatus = 'pending' | 'approved' | 'rejected';

export type ServiceHour = {
  id: string;
  memberId: string;
  eventName: string;
  hours: number;
  date: string;
  description: string;
  status: ServiceHourStatus;
  submittedAt: string;
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

export type Album = {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: string;
  order?: number;
};

export type Photo = {
  id: string;
  albumId: string;
  title?: string;
  description?: string;
  imageUrl: string;
  createdAt: string; // ISO string
  order?: number;
  names?: string[];
};

export type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  grade?: number;
  email: string;
  position: string;
  bio?: string;
  imageUrl?: string;
  order?: number;
  personalUrl?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  tags: string[];
  authorName: string;
  createdAt: string;
  status: 'draft' | 'published';
};

export type HomePageContent = {
  announcementText: string;
};

export type GallerySettings = {
  isTitleRequired?: boolean;
  isDescriptionRequired?: boolean;
  isNamesRequired?: boolean;
};
