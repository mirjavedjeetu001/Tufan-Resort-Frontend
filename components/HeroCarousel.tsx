'use client';
import { useEffect, useState } from 'react';
import Slider from 'react-slick';
import Image from 'next/image';
import { heroSlidesAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await heroSlidesAPI.getActive();
      setSlides(response.data);
    } catch (error) {
      console.error('Error fetching slides:', error);
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    fade: true,
  };

  if (slides.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="relative h-[600px] bg-gradient-to-r from-primary-700 to-primary-900 flex items-center justify-center rounded-2xl shadow-2xl">
          <div className="text-center text-white">
            <h1 className="text-5xl font-heading font-bold mb-4">Welcome to Tufan Resort</h1>
            <p className="text-xl mb-8">Discover Luxury & Tranquility</p>
            <a href="/rooms" className="bg-accent hover:bg-accent-600 text-gray-900 px-8 py-3 rounded-lg font-bold hover:shadow-2xl hover:scale-105 transition-all shadow-lg">
              Explore Rooms
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
        <Slider {...settings}>
          {slides.map((slide: any) => (
            <div key={slide.id} className="relative h-[600px]">
              <div className="relative h-[600px]">
                {slide.image && (
                  <img
                    src={`${API_URL}${slide.image}`}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black opacity-40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white z-10 px-4">
                    <h1 className="text-5xl font-heading font-bold mb-4">{slide.title}</h1>
                    {slide.subtitle && <p className="text-xl mb-8">{slide.subtitle}</p>}
                    {slide.buttonText && slide.buttonLink && (
                      <a href={slide.buttonLink} className="bg-accent hover:bg-accent-600 text-gray-900 px-8 py-3 rounded-lg font-bold hover:shadow-2xl hover:scale-105 transition-all inline-block shadow-lg">
                        {slide.buttonText}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
