export const ImageViewer = ({imageUrl, imageName}: { imageUrl: string, imageName: string }) => {
  return (<img src={imageUrl} alt={imageName}/>)
}