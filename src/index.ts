import { Lifecycle } from "@well-known-components/interfaces"
import { initComponents } from "./components"
import { main } from "./service"
import { runScene } from './logic/scene-runtime'

// This file is the program entry point, it only calls the Lifecycle function
Lifecycle.run({ main, initComponents })
runScene()