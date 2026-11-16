Imports System
Imports System.Collections.Generic
Imports System.IO.Ports

' Never constructs or uses a SerialPort. All bytes and errors are test data.
Public NotInheritable Class MemoryCmri
    Implements InterfaceCMRI

    Public ReadOnly InputBytes As New Dictionary(Of Integer, Integer())()
    Public ReadOnly InputErrors As New Dictionary(Of Integer, Integer)()
    Public ReadOnly LastOutput As New Dictionary(Of Integer, Integer())()
    Public ReadOnly WriteCounts As New Dictionary(Of Integer, Integer)()
    Public InitCount As Integer
    Public PortInitCount As Integer

    Public Sub New()
        InputBytes(0) = New Integer() {85, 85, 5} ' Normal panel point contacts.
        InputBytes(1) = New Integer() {0, 0, 0}
        InputBytes(2) = New Integer() {0, 1, 0} ' Logical power indication only.
        InputBytes(3) = New Integer() {0, 0, 0}
    End Sub

    Private Shared Sub RequireNullPort(ByVal port As SerialPort)
        If port IsNot Nothing Then
            Throw New InvalidOperationException("Test host must pass Nothing for SerialPort.")
        End If
    End Sub

    Public Function InitializePort(ByRef port As SerialPort, ByVal number As Integer,
                                  ByVal rate As Integer, ByVal maximum As Integer) As Integer Implements InterfaceCMRI.InitializePort
        RequireNullPort(port)
        PortInitCount += 1
        Return 0
    End Function

    Public Function INIT(ByRef port As SerialPort, ByVal address As Integer,
                         ByVal delay As Integer, ByVal definition As String,
                         ByVal outputs As Integer, ByVal tries As Integer,
                         ByVal inputs As Integer, ByVal signals As Integer,
                         ByRef cards() As Integer) As Integer Implements InterfaceCMRI.INIT
        RequireNullPort(port)
        If address < 0 OrElse address > 3 OrElse definition <> "M" OrElse inputs <> 3 OrElse outputs <> 6 Then
            Throw New InvalidOperationException("Unexpected baseline SMINI configuration.")
        End If
        InitCount += 1
        Return 0
    End Function

    Public Function INPUTS(ByRef port As SerialPort, ByRef buffer() As Integer,
                           ByVal tries As Integer, ByVal maximum As Integer,
                           ByVal address As Integer, ByVal count As Integer) As Integer Implements InterfaceCMRI.INPUTS
        RequireNullPort(port)
        If count <> 3 OrElse Not InputBytes.ContainsKey(address) Then
            Throw New InvalidOperationException("Unexpected input request.")
        End If
        ' A fault case can supply an empty/partial prefix, deliberately retaining
        ' the remaining shared IB values as the original transport can do.
        Dim supplied() As Integer = InputBytes(address)
        For index As Integer = 0 To supplied.Length - 1
            buffer(index + 1) = supplied(index)
        Next
        If InputErrors.ContainsKey(address) Then Return InputErrors(address)
        Return 0
    End Function

    Public Function OUTPUTS(ByRef port As SerialPort, ByRef address As Integer,
                            ByRef count As Integer, ByRef buffer() As Integer) As Integer Implements InterfaceCMRI.OUTPUTS
        RequireNullPort(port)
        If address < 0 OrElse address > 3 OrElse count <> 6 Then
            Throw New InvalidOperationException("Unexpected output request.")
        End If
        Dim copied(count) As Integer
        For index As Integer = 1 To count
            copied(index) = buffer(index)
        Next
        LastOutput(address) = copied
        If Not WriteCounts.ContainsKey(address) Then WriteCounts(address) = 0
        WriteCounts(address) += 1
        Return 0
    End Function
End Class
