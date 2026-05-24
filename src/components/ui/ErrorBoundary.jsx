import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[HiddenOS Error]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-center">
          <div className="text-red font-mono text-sm mb-2">Something crashed</div>
          <div className="text-ink-5 font-mono text-[10px] bg-bg-3 p-3 rounded text-left overflow-auto max-h-40">
            {this.state.error.toString()}
          </div>
          <button 
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }} 
            className="btn-primary mt-4"
          >
            Go to Dashboard
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
