import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Djaja</h3>
            <p className="text-sm text-gray-200">
              Cloud-based diagnostic platform for telemedicine in 3T areas (Tertinggal, Terdepan, Terluar).
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-gray-200 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/patients" className="text-gray-200 hover:text-white transition-colors">
                  Patients
                </Link>
              </li>
              <li>
                <Link href="/teleconsultation" className="text-gray-200 hover:text-white transition-colors">
                  Teleconsultation
                </Link>
              </li>
              <li>
                <Link href="/device-simulator" className="text-gray-200 hover:text-white transition-colors">
                  Device Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>Email: info@djaja.health</li>
              <li>Phone: +62 XXX XXXX XXXX</li>
              <li>Location: Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-8 pt-6 text-center text-sm text-gray-200">
          <p>&copy; {new Date().getFullYear()} Djaja. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
