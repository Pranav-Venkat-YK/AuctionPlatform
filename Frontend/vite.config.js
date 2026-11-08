import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Service Ports:
 *   UserService    -> http://localhost:8081 (paths: /users/*)
 *   BiddingService -> http://localhost:8082 (paths: /auctions/:id/bids, /auctions/:id/highest-bid)
 *   AuctionService -> http://localhost:8083 (paths: /auctions/*)
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Bidding service routes (must precede generic /auctions)
      '^/auctions/[0-9]+/bids': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '^/auctions/[0-9]+/highest-bid': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Auction service routes
      '/auctions': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // User service routes
      '/users': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    }
  }
})
