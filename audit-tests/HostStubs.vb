Imports System.Text

Public NotInheritable Class MemoryLog
    Private ReadOnly contents As New StringBuilder()

    Public Sub AppendText(ByVal text As String)
        contents.Append(text)
    End Sub

    Public Overrides Function ToString() As String
        Return contents.ToString()
    End Function
End Class

' Test host only. The real form, timer, menus and serial backend are not compiled.
Public Module MainPanel
    Public CommPort As System.IO.Ports.SerialPort = Nothing
    Public ReadOnly txtLogMsg As New MemoryLog()
    Public ReadOnly txtTrainMovements As New MemoryLog()
    Public UpdateCount As Integer

    Public Sub UpdateFormObjects()
        UpdateCount += 1
    End Sub
End Module

Public Module SignalTest
    Public Visible As Boolean
End Module
