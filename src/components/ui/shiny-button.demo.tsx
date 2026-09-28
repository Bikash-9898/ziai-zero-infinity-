// src/components/ui/shiny-button.demo.tsx
// Scratch harness for ShinyButton. Not imported by the app — drop it on a
// route (or comment out a route in App.tsx) to eyeball the animation.
import { ShinyButton } from "@/components/ui/shiny-button";

export default function DemoOne() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ShinyButton onClick={() => alert("Button clicked!")}>Get unlimited access</ShinyButton>
    </div>
  )
}
