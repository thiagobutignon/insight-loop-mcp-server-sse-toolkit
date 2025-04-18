import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { z } from "zod";
import { AlgorithmConfig } from "../models/algorithm-config.js";


/**
 * Text Analyzer Algorithm
 * 
 * Analyzes text content and provides various statistics and insights
 */
const textAnalyzerAlgorithm: AlgorithmConfig = {
  name: "textAnalyzer",
  description: "Analyzes text content and provides statistics and insights",
  paramsSchema: {
    text: z.string().describe("The text content to analyze"),
    options: z.object({
      wordCount: z.boolean().optional().default(true).describe("Count the number of words"),
      characterCount: z.boolean().optional().default(true).describe("Count the number of characters"),
      sentenceCount: z.boolean().optional().default(true).describe("Count the number of sentences"),
      uniqueWords: z.boolean().optional().default(false).describe("Count and list unique words"),
      mostCommonWords: z.boolean().optional().default(false).describe("Find the most common words"),
      topN: z.number().optional().default(5).describe("Number of top entries to return")
    }).optional().default({}).describe("Analysis options")
  },
  handler: async (args: {
    text: string;
    options?: {
      wordCount?: boolean;
      characterCount?: boolean;
      sentenceCount?: boolean;
      uniqueWords?: boolean;
      mostCommonWords?: boolean;
      topN?: number;
    };
  }, extra: RequestHandlerExtra) => {
    console.log("Executing textAnalyzer algorithm");
    
    try {
      const { text, options = {} } = args;
      const result: any = {};
      
      // Default options
      const analysisOptions = {
        wordCount: true,
        characterCount: true,
        sentenceCount: true,
        uniqueWords: false,
        mostCommonWords: false,
        topN: 5,
        ...options
      };
      
      // Process the text
      if (analysisOptions.characterCount) {
        result.characterCount = text.length;
      }
      
      if (analysisOptions.wordCount || analysisOptions.uniqueWords || analysisOptions.mostCommonWords) {
        // Split by whitespace and filter out empty strings
        const words = text.split(/\s+/).filter(word => word.length > 0);
        
        if (analysisOptions.wordCount) {
          result.wordCount = words.length;
        }
        
        if (analysisOptions.uniqueWords || analysisOptions.mostCommonWords) {
          // Normalize words (lowercase, remove punctuation)
          const normalizedWords = words.map(word => 
            word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          );
          
          // Count word frequency
          const wordFrequency: Record<string, number> = {};
          for (const word of normalizedWords) {
            if (word.length > 0) {
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
          }
          
          if (analysisOptions.uniqueWords) {
            result.uniqueWords = {
              count: Object.keys(wordFrequency).length,
              list: Object.keys(wordFrequency)
            };
          }
          
          if (analysisOptions.mostCommonWords) {
            const sortedWords = Object.entries(wordFrequency)
              .sort((a, b) => b[1] - a[1])
              .slice(0, analysisOptions.topN)
              .map(([word, count]) => ({ word, count }));
            
            result.mostCommonWords = sortedWords;
          }
        }
      }
      
      if (analysisOptions.sentenceCount) {
        // Split by sentence-ending punctuation followed by whitespace
        const sentences = text.split(/[.!?]+\s+/).filter(sentence => sentence.length > 0);
        result.sentenceCount = sentences.length;
      }
      
      return {
        success: true,
        analysis: result
      };
    } catch (error: any) {
      console.error(`Error in textAnalyzer algorithm: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default textAnalyzerAlgorithm;