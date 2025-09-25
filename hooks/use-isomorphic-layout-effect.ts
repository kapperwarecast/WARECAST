"use client"

import { useEffect, useLayoutEffect } from "react"

// Use useLayoutEffect on the client, useEffect on the server to avoid hydration warnings
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect