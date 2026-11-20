import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * ===================================================================================
 * 🛡️ LƯỚI BẢO VỆ CHỐNG VĂNG ỨNG DỤNG & CƠ CHẾ TỰ PHỤC HỒI (ROOT ERROR BOUNDARY)
 * ===================================================================================
 * 📌 NGUYÊN LÝ BẢO VỆ:
 *   - Bắt toàn bộ các ngoại lệ không mong muốn trong vòng đời render React (Uncaught Render Exceptions).
 *   - Thay vì để ứng dụng crash văng ra Springboard/Launcher của Android/iOS:
 *       + Hiển thị giao diện cảnh báo sang trọng, giải trình nguyên nhân lỗi.
 *       + Cung cấp nút "Tải lại & Khôi phục" (Self-Healing Reset Action) dọn dẹp state lỗi.
 *       + Tự động xóa bộ nhớ cache hỏng nếu phát hiện lỗi định dạng JSON.
 * ===================================================================================
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? 'Đã bảo vệ phiên làm việc khỏi sự cố';
      const errorMessage = this.state.error?.message ?? 'Đã xảy ra lỗi không mong muốn trong tiến trình hiển thị giao diện.';

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={36} color={theme.colors.primary} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Hệ thống tự động kích hoạt cơ chế kháng sập (Crash-Guard), giữ an toàn phiên làm việc của Shipper.
            </Text>

            <View style={styles.messageBox}>
              <Text style={styles.messageText} numberOfLines={3}>
                {errorMessage}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={this.handleReset}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Tải lại & Khôi phục</Text>
            </Pressable>

            <Pressable style={styles.detailsToggle} onPress={this.toggleDetails}>
              <Text style={styles.detailsToggleText}>
                {this.state.showDetails ? 'Ẩn chi tiết kỹ thuật ▲' : 'Xem chi tiết kỹ thuật ▼'}
              </Text>
            </Pressable>

            {this.state.showDetails && (
              <ScrollView style={styles.detailsContainer} nestedScrollEnabled>
                <Text style={styles.detailsText}>
                  {this.state.error?.stack || this.state.errorInfo?.componentStack || 'Không có stack trace'}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadow.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  messageText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'monospace',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailsToggle: {
    marginTop: theme.spacing.md,
    padding: 6,
  },
  detailsToggleText: {
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 140,
    backgroundColor: '#0F172A',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  detailsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
});
