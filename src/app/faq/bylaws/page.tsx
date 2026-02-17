import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Shield, BookUser, DollarSign, CalendarCheck, Crown, Briefcase, Trophy } from 'lucide-react';

const bylaws = [
  {
    icon: BookUser,
    title: "Article I: Membership & Academic Standing",
    content: [
      {
        heading: "Academic Requirements",
        text: "A minimum 3.5 unweighted GPA is required for all general members. Executive officers and administrators must maintain a higher standard of a 3.7 unweighted GPA."
      },
      {
        heading: "Probation",
        text: "Any member falling below their respective GPA threshold will be placed on 'Administrative Probation' for exactly one semester. Failure to return to the required GPA by the end of said semester results in permanent removal from the chapter roster."
      },
      {
        heading: "Service Mandate",
        text: "Members must complete a minimum of 30 individual service hours per academic year. This includes participation in mandatory club-wide service projects."
      }
    ]
  },
  {
    icon: DollarSign,
    title: "Article II: Financial Obligations & Dues",
    content: [
      {
        heading: "New Member Fees",
        text: "A one-time fee of $50 is required for new inductees, covering National Beta induction, certificate, and the official chapter T-shirt."
      },
      {
        heading: "Returning Member Fees",
        text: "An annual fee of $25 is required for returning members, covering chapter operations and the current year’s T-shirt."
      },
      {
        heading: "Hard Deadline Clause",
        text: "All dues must be paid in full by the date specifically designated by the Executive Leadership Team. Failure to meet this deadline will result in immediate forfeiture of membership and removal from the official National Beta Club registry without exception."
      }
    ]
  },
  {
    icon: CalendarCheck,
    title: "Article III: Attendance & Accountability",
    content: [
      {
        heading: "General Meetings",
        text: "Meetings are held the 2nd and 4th Wednesday of each month."
      },
      {
        heading: "The Dismissal Threshold",
        text: "Any member who accumulates three (3) consecutive absences or seven (7) total absences within one academic year shall be summarily dismissed."
      },
      {
        heading: "Mandatory Review",
        text: "Members missing any meeting must schedule a 1-on-1 accountability session with the Faculty Advisor or the Director of Membership to justify their continued status in the club."
      }
    ]
  },
  {
    icon: Crown,
    title: "Article IV: Executive Board & Governance",
    content: [
      {
        heading: "Supreme Authority",
        text: "In accordance with school policy, the Faculty Advisor maintains 100% discretionary power over all club operations, including the appointment, reassignment, and removal of any officer or member."
      },
      {
        heading: "The Executive Committee",
        text: "The President, Vice President, and Faculty Advisor constitute the 'Executive Committee.'"
      },
      {
        heading: "Officer Removal",
        text: "An officer may be removed from their position if the Executive Committee (Pres/VP/Advisor) reaches a unanimous consensus, or by direct mandate of the Faculty Advisor."
      },
      {
        heading: "Attendance for Leaders",
        text: "Board members are held to a higher standard. Missing two (2) board meetings (staff or convention prep) constitutes an automatic resignation of the title."
      }
    ]
  },
  {
    icon: Briefcase,
    title: "Article V: Structural Reorganization (The 'Sunset' Clause)",
    content: [
      {
        heading: "Operational Efficiency",
        text: "The Executive Committee is required to review the board’s structure every six months to ensure 'Lean Operations.'"
      },
      {
        heading: "Role Dissolution",
        text: "The Executive Committee reserves the absolute right to dissolve, merge, or 'sunset' any Board of Directors position (including Ambassadors, Co-Treasurers, or specialized Directors) if the role is deemed redundant or no longer serves the club's immediate strategic goals."
      },
      {
        heading: "Transfer of Duties",
        text: "Upon the dissolution of a role, all remaining responsibilities shall revert to the Core Executive Board."
      }
    ]
  },
  {
    icon: Trophy,
    title: "Article VI: Convention & Competition",
    content: [
      {
        heading: "Mandatory Competition",
        text: "To maintain an active leadership title, all Board members must compete in at least one category at the State or National Convention."
      },
      {
        heading: "Exemptions",
        text: "Exceptions are strictly limited to 'Special Circumstances' and must be vetted and approved by a joint vote of the Vice President and the Secretary."
      }
    ]
  }
];


export default function BylawsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
          KMHS Beta Chapter Governance
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Effective Date: Spring Semester 2026 | Governing Authority: KMHS Faculty Administration & Executive Committee
        </p>
      </div>
      
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 sm:p-6">
        <Accordion type="single" collapsible className="w-full">
          {bylaws.map((item, index) => {
            const Icon = item.icon;
            return (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-4">
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{item.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-12 pt-4">
                  <div className="space-y-4">
                    {item.content.map((rule, ruleIndex) => (
                      <div key={ruleIndex}>
                        <h4 className="font-bold text-foreground">{rule.heading}</h4>
                        <p className="text-muted-foreground">{rule.text}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  )
}

    