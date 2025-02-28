import React from 'react';

const ServicesSection = () => {
  const services = [
    {
      title: 'Horse Boarding',
      description: 'Top-notch boarding with spacious stalls and daily care.',
      link: '/horse-boarding',
    },
    {
      title: 'Riding Lessons',
      description: 'Lessons for all levels with experienced instructors.',
      link: '/horse-lessons',
    },
    {
      title: 'Trail Rides',
      description: 'Guided rides through scenic farm landscapes.',
      link: '/trail-rides',
    },
    {
      title: 'Events',
      description: 'Clinics, open houses, and seasonal celebrations.',
      link: '/events',
    },
  ];

  return (
    <section id="services" className="py-16 bg-gray-100">
      <h2 className="section-title">Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {services.map((service, index) => (
          <div key={index} className="card">
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p>{service.description}</p>
            <button
              onClick={() => window.location.href = service.link}
              className="btn-primary mt-4"
            >
              Learn More
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;