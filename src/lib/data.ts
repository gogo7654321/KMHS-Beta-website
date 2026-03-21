
import { Award, Heart, Network, Users } from 'lucide-react';
import type { NavLink, Benefit, Event, ServiceVolunteer, ServiceHourEntry, Photo } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const placeholderImages = PlaceHolderImages;

export const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/events', label: 'Events' },
  { href: '/service-hours', label: 'Service' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/leadership', label: 'Leadership' },
  { href: '/faq', label: 'Info' },
  { href: '/contact', label: 'Contact' },
];

export const benefits: Benefit[] = [
  {
    title: 'Scholarships',
    description: 'Access to exclusive scholarships to support your academic journey.',
    icon: Award,
  },
  {
    title: 'Leadership Roles',
    description: 'Develop crucial leadership skills by taking on roles within the club.',
    icon: Users,
  },
  {
    title: 'Community Service',
    description: 'Make a tangible impact in your community through meaningful service projects.',
    icon: Heart,
  },
  {
    title: 'Networking',
    description: 'Connect with peers and leaders at local, state, and national levels.',
    icon: Network,
  },
];

export const events: Event[] = [];

export const serviceStats = {
  goal: 5000,
  current: 3750,
};

export const topVolunteers: ServiceVolunteer[] = [
  { rank: 1, name: 'Jessica Miller', hours: 125 },
  { rank: 2, name: 'David Chen', hours: 110 },
  { rank: 3, name: 'Emily White', hours: 98 },
  { rank: 4, name: 'Michael Brown', hours: 95 },
  { rank: 5, name: 'Sarah Wilson', hours: 82 },
];

export const serviceHoursByMonth: ServiceHourEntry[] = [
  { month: 'Aug', "Service Hours": 350 },
  { month: 'Sep', "Service Hours": 620 },
  { month: 'Oct', "Service Hours": 890 },
  { month: 'Nov', "Service Hours": 750 },
  { month: 'Dec', "Service Hours": 410 },
  { month: 'Jan', "Service Hours": 730 },
];

export const photos: Photo[] = [];
