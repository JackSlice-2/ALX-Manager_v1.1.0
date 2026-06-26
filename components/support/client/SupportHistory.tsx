import React, { useEffect, useState } from 'react'
import { Text, StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native'
import { getLast30DaysHistory } from '@/utils/supportHistory'
import { useT } from '@/hooks/useT'
import ModalContainer from '@/components/utils/modalParts/ModalContainer'

interface SupportHistoryProps {
  visible: boolean
  onClose: () => void
  showHistory: boolean
  setShowHistory: (value: boolean) => void
  expandedDates: Record<string, boolean>
  toggleDate: (date: string) => void
}

const SupportHistory: React.FC<SupportHistoryProps> = ({
  showHistory,
  setShowHistory,
  expandedDates,
  toggleDate
}) => {

  const [history, setHistory] = useState<Record<string, string[]>>({})
  const t = useT()

  useEffect(() => {
    if (showHistory) {
      loadHistory()
    }
  }, [showHistory])

  const loadHistory = async () => {
    const data = await getLast30DaysHistory()
    setHistory(data)
  }

  const sortedDates = Object.entries(history).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  )

  return (
    <ModalContainer
      visible={showHistory}
      onClose={() => setShowHistory(false)}
      data={'Drivers'}
    >
      <View style={styles.container}>
        <Text style={styles.pageTitle}>{t.Support.text4}</Text>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {sortedDates.length === 0 && (
            <Text style={styles.noLogsText}>
              {t.Support.text5}
            </Text>
          )}

          {sortedDates.map(([date, logs]) => {
            const expanded = expandedDates[date]

            return (
              <View key={date} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleDate(date)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.dateText}>{date}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {logs.length} {t.Support.text6}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.chevron}>
                    {expanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.logsContainer}>
                    {logs.map((log, idx) => (
                      <View key={idx} style={styles.logRow}>
                        <View style={styles.dot} />
                        <Text style={styles.logText}>{log}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowHistory(false)}
        >
          <Text style={styles.closeButtonText}>{t.System.Close}</Text>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  )
}

export default SupportHistory

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 20
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000ff',
    marginBottom: 20
  },

  noLogsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
    fontSize: 14,
  },

  card: {
    backgroundColor: '#abb4c3ff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000ff'
  },

  badge: {
    marginTop: 6,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },

  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },

  chevron: {
    fontSize: 18,
    color: '#94a3b8'
  },

  logsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12
  },

  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginTop: 6,
    marginRight: 10
  },

  logText: {
    flex: 1,
    color: '#000000ff',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})