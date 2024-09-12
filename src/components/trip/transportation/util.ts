

export const formatTime = (input: Date) => {
  return input.toLocaleTimeString('en-us', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDate = (input: Date) => {
  return input.toLocaleDateString('en-us', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}