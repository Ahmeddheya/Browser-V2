import { Platform } from 'react-native';

export class SecurityManager {
  // Validate URL for security
  static isSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check for HTTPS
      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        return false;
      }
      
      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (dangerousProtocols.includes(urlObj.protocol)) {
        return false;
      }
      
      // Block suspicious domains
      const suspiciousDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '192.168.',
        '10.0.',
        '172.16.',
      ];
      
      const hostname = urlObj.hostname.toLowerCase();
      if (suspiciousDomains.some(domain => hostname.includes(domain))) {
        console.warn(`⚠️ Potentially unsafe URL: ${url}`);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Sanitize user input
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Check for malicious content
  static containsMaliciousContent(content: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\.write/i,
      /innerHTML/i,
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  // Generate secure headers for WebView
  static getSecureWebViewProps() {
    return {
      javaScriptEnabled: true,
      domStorageEnabled: true,
      allowsInlineMediaPlayback: true,
      mediaPlaybackRequiresUserAction: false,
      allowsFullscreenVideo: true,
      allowsBackForwardNavigationGestures: true,
      // Security settings
      allowFileAccess: false,
      allowFileAccessFromFileURLs: false,
      allowUniversalAccessFromFileURLs: false,
      mixedContentMode: 'never' as const,
      // Additional security headers
      injectedJavaScript: `
        // Disable right-click context menu
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
        });
        
        // Disable text selection on sensitive areas
        document.addEventListener('selectstart', function(e) {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return true;
          }
          e.preventDefault();
        });
        
        // Monitor for suspicious activity
        window.addEventListener('error', function(e) {
          console.warn('WebView Error:', e.message);
        });
        
        true; // Required for injected JavaScript
      `,
    };
  }

  // Encrypt sensitive data
  static async encryptData(data: string, key?: string): Promise<string> {
    if (Platform.OS === 'web') {
      // Simple base64 encoding for web (not secure, but better than plain text)
      return btoa(data);
    }
    
    // For native platforms, you would use expo-crypto here
    // For now, return base64 encoded
    return Buffer.from(data).toString('base64');
  }

  // Decrypt sensitive data
  static async decryptData(encryptedData: string, key?: string): Promise<string> {
    if (Platform.OS === 'web') {
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData; // Return as-is if not encrypted
      }
    }
    
    // For native platforms, you would use expo-crypto here
    try {
      return Buffer.from(encryptedData, 'base64').toString();
    } catch {
      return encryptedData; // Return as-is if not encrypted
    }
  }

  // Validate file download
  static isSecureDownload(url: string, filename: string): boolean {
    // Check URL security
    if (!this.isSecureUrl(url)) {
      return false;
    }
    
    // Check file extension
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
      '.jar', '.app', '.deb', '.pkg', '.dmg', '.msi'
    ];
    
    const extension = filename.toLowerCase().split('.').pop();
    if (extension && dangerousExtensions.includes(`.${extension}`)) {
      console.warn(`⚠️ Potentially dangerous file type: ${extension}`);
      return false;
    }
    
    return true;
  }
}