from ultralytics import YOLO

# Load your trained model (update the path if needed)
model = YOLO('../stable_model_epoch_30.pth')  # or whichever epoch you want

# Export to TorchScript
model.export(format='torchscript')
print("✅ TorchScript model exported as 'stable_model_epoch_30.torchscript'") 