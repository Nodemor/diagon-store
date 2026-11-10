// Motion setup shared by the storefront.
// GSAP + ScrollTrigger drive scroll-linked animation; Lenis provides smooth scrolling.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RoughEase } from "gsap/EasePack";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, RoughEase, useGSAP);

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;

export { gsap, ScrollTrigger, useGSAP };
