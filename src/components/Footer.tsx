import { MapPin, Phone, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="bg-foreground text-background py-8 px-4 md:px-8 mt-12">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-1">
        <h3 className="text-xl font-bold mb-4">A CLICK TO RWANDA</h3>
        <p className="text-sm opacity-90">
          Your gateway to discovering and planning unforgettable journeys in Rwanda.
        </p>
      </div>
      <div className="col-span-1">
        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/about" className="hover:text-accent transition">
              About Us
            </Link>
          </li>
          <li>
            <a href="#" className="hover:text-accent transition">
              Contact
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-accent transition">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-accent transition">
              Terms of Service
            </a>
          </li>
        </ul>
      </div>
      <div className="col-span-1">
        <h4 className="text-lg font-semibold mb-4">Connect</h4>
        <div className="flex space-x-4">
          <a href="#" aria-label="Facebook" className="opacity-70 hover:opacity-100 transition">
            <Phone size={20} />
          </a>
          <a href="#" aria-label="Twitter" className="opacity-70 hover:opacity-100 transition">
            <Mail size={20} />
          </a>
        </div>
      </div>
      <div className="col-span-1">
        <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <MapPin size={16} />
            <span>Kigali, Rwanda</span>
          </li>
          <li className="flex items-center space-x-2">
            <Phone size={16} />
            <a href="tel:+250783497581" className="hover:text-accent transition">0783497581</a>
          </li>
          <li className="flex items-center space-x-2">
            <Mail size={16} />
            <a href="mailto:aclicktorwanda@gmail.com" className="hover:text-accent transition">aclicktorwanda@gmail.com</a>
          </li>
          <li className="flex items-center space-x-2">
            <MapPin size={16} />
            <a href="https://www.aclicktorwanda.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">www.aclicktorwanda.com</a>
          </li>
        </ul>
      </div>
    </div>
    <div className="mt-8 pt-8 border-t border-background/20 text-center text-sm opacity-90">
      <p>&copy; 2025 A CLICK TO RWANDA. All Rights Reserved.</p>
      <Link 
        to="/staff-login" 
        className="inline-flex items-center gap-1 mt-2 text-xs opacity-60 hover:opacity-100 transition"
      >
        <Shield className="w-3 h-3" />
        Staff Portal
      </Link>
    </div>
  </footer>
);
