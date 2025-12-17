import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="absolute top-8 right-8 md:right-12">
        <div className="flex items-center gap-6 md:gap-8 text-sm text-gray-400">
          <a target="_blank" href="https://www.linkedin.com/in/artur-peres-ceschin-desenvolvedor/" className="hover:text-white transition-colors">
            LinkedIn
          </a>
          <a target="_blank" href="https://github.com/Artur-Ceschin" className="hover:text-white transition-colors">
            Github
          </a>
          <a target="_blank" href="https://www.youtube.com/@arturceschin3706" className="hover:text-white transition-colors">
            Youtube
          </a>
          <a target="_blank" href="https://medium.com/@artur.ceschin" className="hover:text-white transition-colors">
            Medium
          </a>
        </div>
      </nav>

      <main className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-2xl w-full text-left">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
            <Image 
              src="/profile-picture.jpeg" 
              alt="Artur Ceschin"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-normal text-white mb-6">
            Hi, I&apos;m Artur.
          </h1>

          <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-2 max-w-xl">
            Fullstack Software Engineer who develops user-centered products. Passionate to create them with engineering and design principles. Currently working on <span className="text-white">delivering high availability and scalable solutions</span> ⚡
          </p>

          <div className="mb-10">
            <h2 className="text-sm font-medium text-white mb-3">Top Skills</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <span>JavaScript/TypeScript</span>
              <span className="text-gray-600">·</span>
              <span>React.js/Next.js</span>
              <span className="text-gray-600">·</span>
              <span>Node.js</span>
              <span className="text-gray-600">·</span>
              <span>AWS</span>
            </div>
          </div>

          {/* CTA Button */}
          <button className="px-8 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer">
            <a href="mailto:artur.ceschin@gmail.com">
              Say Hello
            </a>
          </button>
        </div>
      </main>
    </div>
  );
}
