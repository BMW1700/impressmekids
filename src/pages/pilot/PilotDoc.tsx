import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PilotDocProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PilotDoc({ eyebrow, title, subtitle, children }: PilotDocProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pilot-packet">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pilot Packet
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>

        <article className="rounded-lg border bg-card p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-3xl font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          )}
          <div className="prose prose-sm mt-6 max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-8 prose-h2:text-xl prose-h3:text-base prose-h3:mt-6 prose-p:leading-relaxed prose-li:leading-relaxed">
            {children}
          </div>
          <div className="mt-10 border-t pt-4 text-xs text-muted-foreground">
            YubiLearn Inc. · pilots@yubilearn.com · https://yubilearn.com
          </div>
        </article>
      </div>
    </div>
  );
}
