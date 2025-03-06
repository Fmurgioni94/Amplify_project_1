type MessageFromTheCatProps = {
  message: string;
};

function MessageFromTheCat({ message }: MessageFromTheCatProps) {
  return (
    <div className="w-full min-h-[200px] p-8 bg-gray-50 rounded-lg border border-gray-200 shadow-sm box-wrapper">
      {message ? (
        <p className="text-lg text-gray-700 text-left italic">
          "{message}"
        </p>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400 text-center">
            The cat's response will appear here...
          </p>
        </div>
      )}
    </div>
  );
}

export default MessageFromTheCat;