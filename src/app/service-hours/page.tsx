import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serviceStats, topVolunteers } from "@/lib/data";
import { ServiceHoursChart } from "./service-hours-chart";
import { Crown } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chapter Service Impact',
  description: 'Tracking the collective community impact and service leadership of Kennesaw Mountain High School Beta members.',
};

export default function ServiceHoursPage() {
  const progressPercentage = (serviceStats.current / serviceStats.goal) * 100;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
          Chapter Service Hours
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Tracking our collective impact, one hour at a time.
        </p>
      </div>

      <Card className="mb-8 border-border/50 bg-secondary/20">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Chapter Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-lg font-medium">
            <span className="text-foreground">{serviceStats.current.toLocaleString()} Hours</span>
            <span className="text-muted-foreground">Goal: {serviceStats.goal.toLocaleString()} Hours</span>
          </div>
          <Progress value={progressPercentage} className="h-4 [&>div]:bg-primary" />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            We are {progressPercentage.toFixed(1)}% of the way to our goal!
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-border/50 bg-secondary/20">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Top Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.rank} className="border-border/50">
                    <TableCell className="flex items-center gap-2 text-lg font-medium">
                      {volunteer.rank === 1 && <Crown className="h-5 w-5 text-primary" />}
                      {volunteer.rank}
                    </TableCell>
                    <TableCell>{volunteer.name}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{volunteer.hours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-secondary/20">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Monthly Service Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceHoursChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
