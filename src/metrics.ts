import { IMetricsComponent } from '@well-known-components/interfaces'
import { getDefaultHttpMetrics, validateMetricsDeclaration } from '@well-known-components/metrics'
import { metricDeclarations as logsMetricsDeclarations } from '@well-known-components/logger'

export const metricDeclarations = {
  ...getDefaultHttpMetrics(),
  ...logsMetricsDeclarations,
  scene_state_server_connection_count: {
    help: 'Number of connected peers',
    type: IMetricsComponent.GaugeType
  },
  scene_state_server_state_size: {
    help: 'Scene state size in bytes',
    type: IMetricsComponent.GaugeType,
    labelNames: ['hash']
  },
  scene_state_server_sent_bytes: {
    help: 'Sent size in bytes',
    type: IMetricsComponent.HistogramType,
    labelNames: ['hash']
  },
  scene_state_server_recv_bytes: {
    help: 'Receive size in bytes',
    type: IMetricsComponent.HistogramType,
    labelNames: ['hash']
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
