import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LandingPage from "./pages/LandingPage/LandingPage";
import CameraPage from "./pages/CameraPage/CameraPage";
import DevelopmentDisplay from "./components/Display/DevelopmentDisplay";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home"> 
        <Stack.Screen name="Home" component={LandingPage} />
        <Stack.Screen name="CameraPage" component={CameraPage} />
        <Stack.Screen name="DevelopmentDisplay" component={DevelopmentDisplay} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}