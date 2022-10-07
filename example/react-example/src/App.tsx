import React from 'react';
import logo from './logo.svg';
import './App.css';

import * as HaloChat from '@westudents/halo-chat-core-web'
import { getFirebaseConfig, randomFirstName, randomLastName } from './utils';

const firebaseConfig = getFirebaseConfig()

console.log('firebase config porco dio', firebaseConfig)

HaloChat.initializeChat(firebaseConfig)

function App() {

  const [logged, setLogged] = React.useState<boolean>(false)
  const [agent, setAgent] = React.useState<HaloChat.Types.Agent>()

  const handleLogin = async (): Promise<void> => {
      const a = await HaloChat.AgentActions.login({
        firstName: randomFirstName(),
        lastName: randomLastName(),
        tags: ['TECH'],
        image: 'https://firebasestorage.googleapis.com/v0/b/react-native-firebase-chat-sdk.appspot.com/o/federica.jpeg?alt=media&token=ba54ed01-4aa1-477f-8eae-78bfca3d0967',
   
      })

      setAgent(a)
      setLogged(true)

  }

  return (
    <div className="App">
      {logged ? (
      <>
        <div className='left-section'>
          list chat
        </div>
        <div className='right-section'>
          chat
        </div>
      </>
      ) : (
      <div className='left-section auth-section'>
        <button onClick={handleLogin}>
          login
        </button>
      </div>
      )}
    </div>
  );
}

export default App;
