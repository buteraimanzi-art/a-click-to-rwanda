import lilianeImage from '@/assets/team/liliane.jpeg';
import eliseImage from '@/assets/team/elise.jpeg';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Liliane Tuyizere',
      title: 'Director Manager (CEO)',
      bio: 'Liliane ensures the seamless operation and quality of our services. Her dedication to client satisfaction is the driving force behind our mission.',
      image: lilianeImage,
    },
    {
      name: 'Elise Imanzi Butera',
      title: 'Chief Operating Officer (COO)',
      bio: 'Elise is the visionary leader who spearheads our strategic initiatives, aiming to revolutionize Rwanda tourism sector and create unforgettable experiences.',
      image: eliseImage,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 pt-20">
      <h2 className="text-4xl font-bold text-center text-primary mb-4">About Us</h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
        A CLICK TO RWANDA is your one-stop platform for discovering, planning, and booking your
        dream trip to the Land of a Thousand Hills. We are dedicated to providing a seamless,
        personalized, and unforgettable travel experience.
      </p>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-primary mb-6">Our Mission</h3>
        <p className="text-foreground leading-relaxed">
          Our mission is to empower travelers with the tools and information they need to explore
          Rwanda's rich culture, stunning landscapes, and diverse wildlife. We aim to promote
          sustainable tourism by connecting visitors with reliable local partners and providing
          authentic, immersive experiences.
        </p>
      </section>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-primary mb-6">Meet the Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.name} className="bg-card rounded-lg shadow-lg p-6 text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h4 className="text-xl font-bold text-card-foreground">{member.name}</h4>
              <p className="text-primary font-semibold">{member.title}</p>
              <p className="mt-4 text-sm text-muted-foreground">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
