import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Wifi,
  ArrowRight
} from 'lucide-react';

interface ComingSoonProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="coming-soon-overlay" onClick={onClose}>
      <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="coming-soon-header">
          <h2>Coming Soon</h2>
          <button className="coming-soon-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="coming-soon-content">
          {/* Announcement Section */}
          <div className="coming-soon-announcement">
            <div className="announcement-header">
              <div className="payment-icon-wrapper">
                <CreditCard size={32} />
              </div>
              <h3>New Payment Methods</h3>
            </div>
            <p className="announcement-text">
              We're excited to announce that we're working on integrating new payment methods to make your checkout process even more convenient!
            </p>
          </div>

          {/* Card Payments via Clip Section */}
          <div className="coming-soon-feature">
            <div className="feature-bar"></div>
            <div className="feature-content">
              <div className="feature-header">
                <div className="feature-icon green">
                  <CreditCard size={24} />
                </div>
                <h4>Card Payments via Clip</h4>
              </div>
              <p className="feature-description">
                Accept card payments seamlessly using Clip payment terminals. Process credit and debit card transactions directly from your POS system.
              </p>
              <div className="feature-subtitle">Clip Payment Integration:</div>
              <div className="feature-illustration">
                <div className="illustration-item">
                  <div className="phone-mockup">
                    <div className="phone-screen">
                      <div className="phone-header">Thesa Cale</div>
                      <div className="phone-content">
                        <div className="payment-card-visual">
                          <div className="card-chip"></div>
                          <div className="card-lines"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="wave-lines">
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                    <div className="wave wave-3"></div>
                  </div>
                </div>
                <div className="illustration-item">
                  <div className="card-mockup">
                    <div className="card-stripe orange"></div>
                    <div className="card-wifi-icon">
                      <Wifi size={20} />
                    </div>
                  </div>
                  <div className="wave-lines">
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                    <div className="wave wave-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Codi Payments Section */}
          <div className="coming-soon-feature">
            <div className="feature-bar"></div>
            <div className="feature-content">
              <div className="feature-header">
                <div className="feature-icon black">
                  <Smartphone size={24} />
                </div>
                <h4>Codi Payments</h4>
              </div>
              <p className="feature-description">
                Enable customers to pay using Codi (SPEI) - Mexico's instant payment system. Customers can scan a QR code or enter a reference number to complete their payment.
              </p>
              <div className="feature-subtitle">Codi Payment Flow:</div>
              <div className="codi-flow">
                <div className="flow-step">
                  <QrCode size={32} />
                  <span>Scan QR Code</span>
                </div>
                <ArrowRight size={24} className="flow-arrow" />
                <div className="flow-step">
                  <Smartphone size={32} />
                  <span>Enter Reference</span>
                </div>
                <ArrowRight size={24} className="flow-arrow" />
                <div className="flow-step">
                  <CreditCard size={32} />
                  <span>Complete Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

