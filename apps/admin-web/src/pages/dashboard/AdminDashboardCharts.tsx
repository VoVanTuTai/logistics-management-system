import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  MasterdataHealthChartPoint,
  RoleMixChartPoint,
  UserStatusChartPoint,
} from './AdminDashboardPage';

interface AdminDashboardChartsProps {
  roleMix: RoleMixChartPoint[];
  userStatus: UserStatusChartPoint[];
  masterdataHealth: MasterdataHealthChartPoint[];
  hasUserData: boolean;
  hasStatusData: boolean;
  hasMasterdataData: boolean;
  formatCount: (value: number) => string;
}

const USER_ROLE_COLORS = ['#4f46e5', '#0891b2', '#f59e0b'];
const STATUS_COLORS = ['#137f5d', '#b12233'];

export function AdminDashboardCharts({
  roleMix,
  userStatus,
  masterdataHealth,
  hasUserData,
  hasStatusData,
  hasMasterdataData,
  formatCount,
}: AdminDashboardChartsProps): React.JSX.Element {
  return (
    <section className="admin-chart-grid">
      <article className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h3>Cơ cấu tài khoản theo nhóm</h3>
            <p>So sánh quy mô Ops, Shipper và Merchant đang quản trị.</p>
          </div>
        </div>
        <div className="admin-chart-body">
          {hasUserData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roleMix} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [formatCount(Number(value)), 'Tài khoản']} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {roleMix.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={USER_ROLE_COLORS[index % USER_ROLE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-chart-empty">Chưa có dữ liệu tài khoản để vẽ biểu đồ.</div>
          )}
        </div>
      </article>

      <article className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h3>Trạng thái tài khoản</h3>
            <p>Tỷ lệ tài khoản đang hoạt động và đã vô hiệu hóa.</p>
          </div>
        </div>
        <div className="admin-chart-body">
          {hasStatusData ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={userStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {userStatus.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCount(Number(value)), 'Tài khoản']} />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-chart-empty">Chưa có dữ liệu trạng thái tài khoản.</div>
          )}
        </div>
      </article>

      <article className="admin-chart-card admin-chart-card-wide">
        <div className="admin-chart-header">
          <div>
            <h3>Sức khỏe dữ liệu masterdata</h3>
            <p>Theo dõi danh mục đang hoạt động và danh mục đã tắt.</p>
          </div>
        </div>
        <div className="admin-chart-body">
          {hasMasterdataData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={masterdataHealth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [formatCount(Number(value)), 'Bản ghi']} />
                <Legend verticalAlign="top" height={32} />
                <Bar
                  dataKey="active"
                  name="Active"
                  stackId="masterdata"
                  fill="#137f5d"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="inactive"
                  name="Inactive"
                  stackId="masterdata"
                  fill="#f59e0b"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-chart-empty">Chưa có dữ liệu masterdata để phân tích.</div>
          )}
        </div>
      </article>
    </section>
  );
}
