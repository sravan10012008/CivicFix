// Central icon registry — maps string names to lucide-react icon components.
import {
  Trash2, Construction, Lightbulb, Droplets, Waves, TreePine, Zap, Building2, Trees,
  CircleAlert, FileText, Clock, Loader, CheckCircle2, UserCheck, AlertTriangle,
  ClipboardList, Hash, MapPin, Search, Filter, ChevronRight, ArrowRight, ArrowUpRight,
  Home, LayoutDashboard, Bell, Settings, LogOut, Plus, Eye, Upload, Camera, X,
  CheckCircle, Circle, CircleDot, Menu, Shield, Users, Wrench, BarChart3, ChevronDown,
  Send, Image as ImageIcon, Phone, Mail, Lock, User, Eye as EyeIcon, Sparkles,
} from "lucide-react";

const icons = {
  Trash2, Construction, Lightbulb, Droplets, Waves, TreePine, Zap, Building2, Trees,
  CircleAlert, FileText, Clock, Loader, CheckCircle2, UserCheck, AlertTriangle,
  ClipboardList, Hash, MapPin, Search, Filter, ChevronRight, ArrowRight, ArrowUpRight,
  Home, LayoutDashboard, Bell, Settings, LogOut, Plus, Eye, Upload, Camera, X,
  CheckCircle, Circle, CircleDot, Menu, Shield, Users, Wrench, BarChart3, ChevronDown,
  Send, ImageIcon, Phone, Mail, Lock, User, EyeIcon, Sparkles,
};

export default function Icon({ name, className }) {
  const Cmp = icons[name] || CircleAlert;
  return <Cmp className={className} />;
}