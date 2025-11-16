'use client';

import Link from 'next/link';
import { Activity, Heart, Users, Stethoscope } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">
            Djaja Diagnostics
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cloud-based diagnostic platform bringing quality healthcare to remote areas (3T)
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<Activity className="w-8 h-8" />}
            title="IoT Diagnostics"
            description="Real-time vital signs monitoring"
          />
          <FeatureCard
            icon={<Heart className="w-8 h-8" />}
            title="AI Analysis"
            description="Intelligent diagnostic engine"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Telemedicine"
            description="Remote consultation system"
          />
          <FeatureCard
            icon={<Stethoscope className="w-8 h-8" />}
            title="FHIR Ready"
            description="Compliant medical records"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/device-simulator"
            className="px-8 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
          >
            Device Simulator
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard number="1000+" label="Patients Served" />
            <StatCard number="50+" label="Healthcare Facilities" />
            <StatCard number="5000+" label="Diagnostic Tests" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-primary/10">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-primary mb-2">{number}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
