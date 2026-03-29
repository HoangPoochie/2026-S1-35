
const format = (level, message, meta) => {
  const ts = new Date().toISOString();
  if (meta === undefined) return `[${ts}] [${level}] ${message}`;
  return `[${ts}] [${level}] ${message} ${JSON.stringify(meta)}`;
};

const logger = {
  info(message, meta) {
    console.log(format("INFO", message, meta));
  },
  warn(message, meta) {
    console.warn(format("WARN", message, meta));
  },
  error(message, meta) {
    console.error(format("ERROR", message, meta));
  },
  stream: {
    write(message) {
      console.log(message.trim());
    }
  }
};

export default logger;
