"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export type TestimonialItem = {
  text: string;
  image: string;
  name: string;
  role: string;
};

export function TestimonialsColumn(props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={props.className}>
      <motion.div
        animate={shouldReduceMotion ? undefined : { translateY: "-50%" }}
        transition={shouldReduceMotion ? undefined : {
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
        className="testimonials-column-track"
      >
        {[0, 1].map((loopIndex) => (
          <React.Fragment key={loopIndex}>
            {props.testimonials.map(({ text, image, name, role }) => (
              <article className="testimonial-card" key={`${loopIndex}-${name}`}>
                <p>{text}</p>
                <div className="testimonial-person">
                  <Image width={40} height={40} src={image} alt={name} />
                  <div>
                    <strong>{name}</strong>
                    <span>{role}</span>
                  </div>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
