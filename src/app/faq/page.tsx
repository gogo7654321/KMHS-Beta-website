import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ListPlus, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Info',
  description: 'Official chapter bylaws, membership information, and helpful links for Kennesaw Mountain High School Beta Club members.',
};

const resources = [
  {
    title: 'Chapter Bylaws',
    description: 'Read the official governance and regulations for the KMHS Beta chapter.',
    href: '/faq/bylaws',
    icon: Shield,
    disabled: false,
  },
  {
    title: 'Instagram Updates',
    description: 'Follow our official page @kmhsbetaclub for the latest news and photos.',
    href: 'https://www.instagram.com/kmhsbetaclub',
    icon: Instagram,
    disabled: false,
    external: true,
  },
  {
    title: 'Log Service Hours',
    description: 'Submit your completed service hours here. (Portal coming soon)',
    href: '#',
    icon: ListPlus,
    disabled: true,
  },
];

export default function FaqPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
          Info & Resources
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Quick access to important documents and links.
        </p>
      </div>
      <div className="space-y-6">
        {resources.map((resource) => {
          const Icon = resource.icon;
          const Wrapper = resource.disabled ? 'div' : (resource.external ? 'a' : Link);

          return (
            <Wrapper
              key={resource.title}
              {...(resource.disabled ? {} : { href: resource.href, ...(resource.external ? { target: "_blank", rel: "noopener noreferrer" } : {}) })}
              className={cn(
                "block",
                resource.disabled && "cursor-not-allowed"
              )}
            >
              <Card
                className={cn(
                  'border-border/50 bg-secondary/20 transition-all',
                  !resource.disabled && 'group hover:border-primary/80 hover:shadow-primary/10 hover:-translate-y-1'
                )}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <div className={cn(
                      "rounded-md p-3",
                      resource.disabled ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold", resource.disabled && 'text-muted-foreground')}>{resource.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                </CardHeader>
              </Card>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
