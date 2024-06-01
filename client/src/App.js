import React, { useState, useEffect } from "react";
import { Interactive, XR, Controllers, VRButton } from "@react-three/xr";
import { Sky, Text } from "@react-three/drei";
import "@react-three/fiber";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import socket from "./socket-client";

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#666" />
    </mesh>
  );
}

function Box({ color, size, scale, children, ...rest }) {
  return (
    <mesh scale={scale} {...rest}>
      <boxGeometry args={size} />
      <meshPhongMaterial color={color} />
      {children}
    </mesh>
  );
}

function Button(props) {
  const [hover, setHover] = useState(false);
  const [color, setColor] = useState(0x123456);

  const onSelect = () => {
    const newColor = (Math.random() * 0xffffff) | 0;
    setColor(newColor);
    socket.emit("newColor", newColor);
  };

  return (
    <Interactive
      onSelect={onSelect}
      onHover={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <Box
        color={color}
        scale={hover ? [1.5, 1.5, 1.5] : [1, 1, 1]}
        size={[0.4, 0.1, 0.1]}
        {...props}
      >
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.05}
          color="#000"
          anchorX="center"
          anchorY="middle"
        >
          Simple Button Color Sync
        </Text>
      </Box>
    </Interactive>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Handle incoming messages
    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up the effect
    return () => {
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      // Send message to the server
      socket.emit("message", input);
      setInput("");
    }
  };

  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <Sky sunPosition={[0, 1, 0]} />
          <Floor />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Controllers />
          <Button position={[0, 0.8, -1]} />
        </XR>
      </Canvas>
    </>
  );
}