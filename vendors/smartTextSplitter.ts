/**
 * Splits text into digestible parts with smart boundaries and fallback logic.
 * @param text The input text to divide
 * @param chunkSize Preferred max size for each chunk
 * @param overlap How much content to overlap between chunks (in characters)
 * @returns An array of string chunks
 */
export function smartTextSplitter(text: string, chunkSize: number = 1000, overlap: number = 150): string[] {
    if (!text || chunkSize <= 0 || overlap >= chunkSize) return [];

    const result: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?\s]+|[^.!?]+$/g) || [text];
    let buffer = "";

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();

        if ((buffer + " " + sentence).length > chunkSize) {
            if (buffer) {
                result.push(buffer.trim());
                const overlapContent = buffer.slice(-overlap);
                buffer = overlapContent;
            }
        }

        if (sentence.length > chunkSize) {
            let words = sentence.split(" ");
            let subBuffer = buffer;

            for (let word of words) {
                if ((subBuffer + " " + word).length > chunkSize) {
                    result.push(subBuffer.trim());
                    const tail = subBuffer.slice(-overlap);
                    subBuffer = tail + " " + word;
                } else {
                    subBuffer += " " + word;
                }
            }

            buffer = subBuffer;
        } else {
            buffer += (buffer ? " " : "") + sentence;
        }
    }

    if (buffer.trim()) {
        result.push(buffer.trim());
    }

    return result;
}