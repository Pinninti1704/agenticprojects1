import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [alarms, setAlarms] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alarmTime, setAlarmTime] = useState('')
  const [alarmLabel, setAlarmLabel] = useState('')

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check for alarms every second
  useEffect(() => {
    const checkAlarms = setInterval(() => {
      const now = new Date()
      const currentTimeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })

      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTimeStr && !alarm.ringing) {
          triggerAlarm(alarm.id)
        }
      })
    }, 1000)

    return () => clearInterval(checkAlarms)
  }, [alarms])

  const triggerAlarm = (alarmId) => {
    setAlarms(prev => prev.map(alarm =>
      alarm.id === alarmId ? { ...alarm, ringing: true } : alarm
    ))

    // Create simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 5)

    // Stop after 5 seconds
    setTimeout(() => {
      stopRinging(alarmId)
    }, 5000)

    // Visual alert
    alert('Alarm ringing: ' + alarms.find(a => a.id === alarmId)?.label)
  }

  const addAlarm = () => {
    if (!alarmTime) return

    const newAlarm = {
      id: Date.now(),
      time: alarmTime,
      label: alarmLabel || 'Alarm',
      enabled: true,
      ringing: false
    }

    setAlarms([...alarms, newAlarm])
    setAlarmTime('')
    setAlarmLabel('')
  }

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(alarm =>
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ))
  }

  const deleteAlarm = (id) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== id))
  }

  const stopRinging = (id) => {
    setAlarms(prev => prev.map(alarm =>
      alarm.id === id ? { ...alarm, ringing: false } : alarm
    ))
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="alarm-app">
      <div className="container">
        <header>
          <h1>⏰ Simple Alarm Clock</h1>
          <div className="current-time">{formatTime(currentTime)}</div>
        </header>

        <div className="add-alarm-section">
          <h2>Add New Alarm</h2>
          <div className="input-group">
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="time-input"
            />
            <input
              type="text"
              value={alarmLabel}
              onChange={(e) => setAlarmLabel(e.target.value)}
              placeholder="Alarm label (optional)"
              className="label-input"
            />
            <button onClick={addAlarm} disabled={!alarmTime} className="add-btn">
              Add Alarm
            </button>
          </div>
        </div>

        <div className="alarms-section">
          <h2>Your Alarms ({alarms.length})</h2>
          {alarms.length === 0 ? (
            <p className="no-alarms">No alarms set. Add one above!</p>
          ) : (
            <div className="alarms-list">
              {alarms.map(alarm => (
                <div
                  key={alarm.id}
                  className={`alarm-item ${alarm.ringing ? 'ringing' : ''} ${!alarm.enabled ? 'disabled' : ''}`}
                >
                  <div className="alarm-info">
                    <span className="alarm-time">{alarm.time}</span>
                    <span className="alarm-label">{alarm.label}</span>
                    <div className={`status ${alarm.enabled ? 'enabled' : 'disabled'}`}>
                      {alarm.enabled ? 'ON' : 'OFF'}
                    </div>
                  </div>
                  <div className="alarm-actions">
                    {alarm.ringing ? (
                      <button onClick={() => stopRinging(alarm.id)} className="stop-btn">
                        Stop 🔔
                      </button>
                    ) : (
                      <button onClick={() => toggleAlarm(alarm.id)} className="toggle-btn">
                        {alarm.enabled ? 'Disable' : 'Enable'}
                      </button>
                    )}
                    <button onClick={() => deleteAlarm(alarm.id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App