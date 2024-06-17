import React, { useState, useEffect } from "react";
import { Interactive, XR, Controllers, VRButton } from "@react-three/xr";
import { Sky, Text } from "@react-three/drei";
import "@react-three/fiber";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import socket from "./socket-client";

import axios from "axios";

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

  const onSelect = () => {
    const newColor = (Math.random() * 0xffffff) | 0;
    props.setColor(newColor);
    socket.emit("changeColor", newColor);
  };

  useEffect(() => {
    // Handle incoming color updates
    socket.on("color", (newColor) => {
      props.setColor(newColor);
    });

    // Clean up the effect
    return () => {
      socket.off("color");
    };
  }, [props.setColor]);

  return (
    <Interactive
      onSelect={onSelect}
      onHover={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <Box
        color={props.color}
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
          Color Sync
        </Text>
      </Box>
    </Interactive>
  );
}

export default function App() {
  const [color, setColor] = useState(0x123456);
  const [message, setMessage] = useState("");

  useEffect(() => {

    // Handle incoming color updates
    socket.on("color", (newColor) => {
      setColor(newColor);
    });

    // Handle the ping event from the server
    socket.on('ping', ({ pingSendTime }) => {
      console.log('Ping received from server');
      const pingReceiveTime = Date.now();
      socket.emit('pong', { pingReceiveTime });
  });

    // Handle packet event
    socket.on('packet', (packet) => {
        console.log('Packet received:', packet);
        socket.emit('packetReceived');
    });

    // Clean up the effect
    return () => {
      socket.off("color");
      socket.off('ping');
      socket.off('packet');
    };
  }, []);

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
          <Button position={[0, 0.8, -1]} color={color} setColor={setColor} />
        </XR>
      </Canvas>
    </>
  );
}
