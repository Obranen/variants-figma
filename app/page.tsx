'use client'

import { useState, useEffect } from 'react'
import RegistrationForm from './components/RegistrationForm'

const Home = () => {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      <button
        onClick={toggleTheme}
        className="mb-4 px-4 py-2 bg-primary text-white rounded"
      >
        Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
      </button>
      {/* <RegistrationForm /> */}
      <h1 className="3xl:bg-primary">Hello world!</h1>
      {/* <div className="bg-primary">with css</div> */}
    </>
  )
}

export default Home
