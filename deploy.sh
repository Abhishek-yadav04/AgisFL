#!/bin/bash

# AgisFL Enterprise Production Deployment Script
# This script handles the complete production deployment of the AgisFL platform

set -e

echo "🚀 Starting AgisFL Enterprise Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed."
}

# Build and deploy the application
deploy() {
    print_status "Building and deploying AgisFL Enterprise..."

    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true

    # Remove old images
    print_status "Cleaning up old images..."
    docker system prune -f

    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f docker-compose.prod.yml up --build -d

    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 30

    # Check service health
    check_services

    print_success "AgisFL Enterprise deployed successfully!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:8000"
    print_status "Database: localhost:5432"
    print_status "Redis: localhost:6379"
}

# Check if services are running
check_services() {
    print_status "Checking service health..."

    # Check backend
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "Backend service is healthy"
    else
        print_error "Backend service is not responding"
    fi

    # Check frontend
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend service is healthy"
    else
        print_error "Frontend service is not responding"
    fi

    # Check database
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U agisfl &> /dev/null; then
        print_success "Database service is healthy"
    else
        print_warning "Database service status unknown"
    fi
}

# View logs
logs() {
    print_status "Showing service logs..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# Stop services
stop() {
    print_status "Stopping all services..."
    docker-compose -f docker-compose.prod.yml down
    print_success "All services stopped."
}

# Restart services
restart() {
    print_status "Restarting all services..."
    docker-compose -f docker-compose.prod.yml restart
    print_success "All services restarted."
}

# Update services
update() {
    print_status "Updating services..."
    docker-compose -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.prod.yml up --build -d
    print_success "Services updated."
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Deploy the application (default)"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  update    - Update and redeploy services"
    echo "  logs      - Show service logs"
    echo "  check     - Check service health"
    echo "  help      - Show this help message"
}

# Main script logic
main() {
    check_docker

    case "${1:-deploy}" in
        deploy)
            deploy
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        update)
            update
            ;;
        logs)
            logs
            ;;
        check)
            check_services
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            print_error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
